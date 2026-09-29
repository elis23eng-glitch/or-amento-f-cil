/** Normaliza telefones brasileiros para o formato wa.me, sem duplicar o 55. */
export function normalizeBRPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = String(input).replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (digits.startsWith("55")) digits = digits.slice(2);
  // DDD (2) + 8 ou 9 dígitos
  if (digits.length < 10 || digits.length > 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (digits.length === 11 && digits[2] !== "9") return null;
  return `55${digits}`;
}

export function formatBRPhone(input: string | null | undefined): string {
  const n = normalizeBRPhone(input);
  if (!n) return input ?? "—";
  const d = n.slice(2);
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const mid = rest.length === 9 ? rest.slice(0, 5) : rest.slice(0, 4);
  const end = rest.length === 9 ? rest.slice(5) : rest.slice(4);
  return `(${ddd}) ${mid}-${end}`;
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
