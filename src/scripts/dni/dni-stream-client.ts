export type SectionHandler = (section: string, data: unknown) => void;
export type DniStreamHandle = { close: () => void };

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

function maskDni(dni: string): string {
  const d = String(dni || "");
  return d.length >= 2 ? `${d.slice(0, 2)}***${d.slice(-1)}` : "***";
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
  onError?: (err: any) => void
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
      dniDbg("stream start", { dni: maskDni(dni), url: `${backendBase()}/dni/stream` });
      const response = await fetch(`${backendBase()}/dni/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "text/event-stream", "X-Consultation-Ticket": ticket },
        body: JSON.stringify({ dni }),
        signal: abort.signal,
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
              let message = "No se pudo validar el DNI.";
              try {
                const detail = JSON.parse(payload);
                if (typeof detail?.error === "string") message = detail.error;
              } catch { /* Keep the safe default for malformed SSE. */ }
              completed = true;
              abort.abort();
              onError?.(new Error(message));
              break;
            }
            if (eventName === "done") {
              completed = true;
              abort.abort();
              dniDbg("done", { elapsed_ms: Date.now() - t0 });
              onDone?.();
              break;
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
              handler(eventName, decoded);
            } else if (debug) {
              dniDbg("unhandled-event", { event: eventName, bytes: payload.length, elapsed_ms: Date.now() - t0 });
            }
          }
        }
        if (completed) break;
      }
      if (!completed && !abort.signal.aborted) onError?.(new Error("SSE ended before done"));
    } catch (error) {
      dniDbg("stream error", { message: error instanceof Error ? error.message : String(error), elapsed_ms: Date.now() - t0 });
      if (!abort.signal.aborted) onError?.(error);
    }
  })();
  return { close: () => abort.abort() };
}
