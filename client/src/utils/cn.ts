/**
 * Simple, zero-dependency classname concatenation helper.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
