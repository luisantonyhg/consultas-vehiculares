export type SectionHandler = (section: string, data: unknown) => void;
export type DniDiagnostic = Record<string, unknown>;
export type DniStreamHandle = { close: () => void; traceId: string };

/** Debug opt-in: `localStorage dni_debug=1` o `?dni_debug=1`. Sin PII en consola. */
export function dniDebugEnabled(): boolean {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("dni_debug") === "1") return true;
    if (typeof location !== "undefined" && /(?:\?|&)dni_debug=1(?:&|$)/.test(location.search)) return true;
  } catch { /* almacenamiento no disponible */ }
  return false;
}

function dniDbg(...args: unknown[]): void {
  if (dniDebugEnabled()) console.debug("[DNI]", ...args);
}

export function backendBase(): string {
  const pub = (import.meta as unknown as { env?: Record<string, string> }).env?.PUBLIC_BACKEND_URL;
  if (pub) return pub.replace(/\/$/, "");
  if (typeof location !== "undefined" && /localhost|127\.0\.0\.1/.test(location.hostname)) {
    return "http://localhost:8000/api/v1";
  }
  return "https://backend-consultarvehiculos-production.up.railway.app/api/v1";
}

export function startDniStream(
  dni: string,
  ticket: string,
  onSectionReady: SectionHandler,
  onDone?: () => void,
  onError?: (err: any) => void,
  onDiagnostic?: (event: DniDiagnostic) => void,
  traceId = createTraceId(),
): DniStreamHandle {
  const abort = new AbortController();
  const handlers = new Map<string, SectionHandler>();
  for (const ev of ["identidad", "jne_multas", "minedu", "sunat", "transporte_papeletas", "transporte_record", "osce", "webmii", "infogob", "transporte_licencias"]) {
    handlers.set(ev, onSectionReady);
  }
  void (async () => {
    const t0 = Date.now();
    const debug = dniDebugEnabled();
    try {
      dniDbg("stream start", { request_id: traceId, url: `${backendBase()}/dni/stream` });
      const response = await fetch(`${backendBase()}/dni/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
          "X-Consultation-Ticket": ticket,
          "X-Client-Request-ID": traceId,
        },
        body: JSON.stringify({ dni }),
        signal: abort.signal,
      });
      onDiagnostic?.({
        source: "frontend", request_id: traceId, provider: "backend",
        stage: "http_connected", status: response.status,
        elapsed_ms: Date.now() - t0,
        backend_request_id: response.headers.get("X-Request-ID") || undefined,
      });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventName = "";
      let completed = false;
      while (!abort.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line) {
            eventName = "";
          } else if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const payload = line.slice(5).trim();
            if (eventName === "error") {
              let code = "DNI_STREAM_ERROR";
              try {
                const detail = JSON.parse(payload);
                if (typeof detail?.code === "string") code = detail.code;
              } catch { /* Keep the safe default for malformed SSE. */ }
              completed = true;
              abort.abort();
              onDiagnostic?.({ source: "backend", request_id: traceId, provider: "backend", stage: "stream_error", status: "ERROR", reason: code, elapsed_ms: Date.now() - t0 });
              onError?.(new Error(code));
              break;
            }
            if (eventName === "done") {
              completed = true;
              abort.abort();
              onDiagnostic?.({ source: "frontend", request_id: traceId, provider: "backend", stage: "sse_done_received", status: "OK", elapsed_ms: Date.now() - t0 });
              dniDbg("done", { elapsed_ms: Date.now() - t0 });
              onDone?.();
              break;
            }
            if (eventName === "diagnostic") {
              try {
                const event = JSON.parse(payload) as DniDiagnostic;
                onDiagnostic?.({ source: "backend", ...event });
              } catch {
                onDiagnostic?.({ source: "backend", request_id: traceId, provider: "backend", stage: "malformed_diagnostic_event", status: "WARN", payload_bytes: payload.length });
              }
              continue;
            }
            const handler = handlers.get(eventName);
            if (handler) {
              let decoded: unknown = payload;
              try { decoded = JSON.parse(payload); } catch { /* Keep the original SSE payload. */ }
              if (debug) {
                let status = "?";
                let bytes = payload.length;
                try {
                  const d = JSON.parse(payload) as { status?: unknown };
                  if (typeof d?.status === "string") status = d.status;
                } catch { /* payload no-JSON */ }
                dniDbg("section", { event: eventName, status, bytes, elapsed_ms: Date.now() - t0 });
              }
              onDiagnostic?.({ source: "frontend", request_id: traceId, provider: eventName, stage: "section_event_received", status: "RECEIVED", payload_bytes: payload.length, elapsed_ms: Date.now() - t0 });
              handler(eventName, decoded);
            } else if (debug) {
              dniDbg("unhandled-event", { event: eventName, bytes: payload.length, elapsed_ms: Date.now() - t0 });
            }
          }
        }
        if (completed) break;
      }
      if (!completed && !abort.signal.aborted) {
        onDiagnostic?.({ source: "frontend", request_id: traceId, provider: "backend", stage: "sse_ended_without_done", status: "ERROR", elapsed_ms: Date.now() - t0 });
        onError?.(new Error("SSE_ENDED_WITHOUT_DONE"));
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "NETWORK_ERROR";
      onDiagnostic?.({ source: "frontend", request_id: traceId, provider: "backend", stage: "fetch_or_stream_error", status: "ERROR", reason: safeErrorCode(reason), elapsed_ms: Date.now() - t0 });
      dniDbg("stream error", { reason: safeErrorCode(reason), elapsed_ms: Date.now() - t0 });
      if (!abort.signal.aborted) onError?.(error);
    }
  })();
  return { close: () => abort.abort(), traceId };
}

function createTraceId(): string {
  try { return crypto.randomUUID(); } catch { return `dni-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
}

function safeErrorCode(reason: string): string {
  if (/^HTTP \d{3}$/i.test(reason)) return reason.replace(/\s+/g, "_").toUpperCase();
  if (/timeout|timed out/i.test(reason)) return "TIMEOUT";
  if (/network|fetch/i.test(reason)) return "NETWORK_ERROR";
  if (/SSE_/i.test(reason)) return reason.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 48);
  return "STREAM_ERROR";
}
