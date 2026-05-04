import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Date reference — use this everywhere instead of hardcoded date strings.
// In production this will always reflect the real current date.
// ---------------------------------------------------------------------------
export const TODAY_ISO: string = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Formatters — moved here from mockData.ts so that when mock data is replaced
// by a real API layer, these helpers remain available without any import changes.
// ---------------------------------------------------------------------------

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(date: string): string {
  if (!date) return '-';
  const d = new Date(date + (date.includes('T') || date.includes(' ') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('pt-BR');
}

export function formatDatetime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
