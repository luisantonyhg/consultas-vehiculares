export interface ValidationResult {
  isValid: boolean;
  error?: string;
  cleanDni: string;
}

const INVALID = new Set([
  "00000000", "11111111", "22222222", "33333333",
  "44444444", "55555555", "66666666", "77777777",
  "88888888", "99999999", "12345678", "87654321",
]);

export function validateDni(input: string): ValidationResult {
  const clean = (input || "").replace(/\D/g, "").trim();
  if (!clean) return { isValid: false, error: "Ingresa un número de DNI", cleanDni: clean };
  if (clean.length !== 8) return { isValid: false, error: "El DNI debe tener exactamente 8 dígitos", cleanDni: clean };
  if (INVALID.has(clean)) return { isValid: false, error: "Número de DNI no válido", cleanDni: clean };
  return { isValid: true, cleanDni: clean };
}
