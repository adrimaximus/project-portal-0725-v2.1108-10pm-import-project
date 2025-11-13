export function formatMentions(text: string | null | undefined): string {
  if (!text) return '';
  // This regex finds patterns like @[Display Name](uuid) and replaces them with @Display Name
  return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
}