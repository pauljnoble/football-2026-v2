export function formatPlayerListName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const firstInitial = parts[0][0].toUpperCase();
  const lastName = parts[parts.length - 1];

  return `${firstInitial}. ${lastName}`;
}
