type ClassValue = string | number | false | null | undefined

/**
 * Junta classes condicionais numa string. Sem dedupe de conflito Tailwind —
 * se isso passar a doer, trocar por clsx + tailwind-merge (princípio 6: YAGNI).
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
