const HEX_3 = /^#?[0-9a-fA-F]{3}$/;
const HEX_6 = /^#?[0-9a-fA-F]{6}$/;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function normalizeHex(hex: string): string {
  const value = hex.trim();
  if (HEX_3.test(value)) {
    const raw = value.replace(/^#/, "");
    return `#${raw
      .split("")
      .map((c) => `${c}${c}`)
      .join("")
      .toLowerCase()}`;
  }

  if (HEX_6.test(value)) {
    return `#${value.replace(/^#/, "").toLowerCase()}`;
  }

  throw new Error(`Invalid hex color: "${hex}"`);
}

export function brighten(hex: string, amount: number): string {
  const normalized = normalizeHex(hex);
  const t = clamp01(amount);
  const raw = normalized.slice(1);

  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);

  const brightenChannel = (channel: number): number =>
    Math.round(channel + (255 - channel) * t);

  const toHex = (channel: number): string =>
    brightenChannel(channel).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function darken(hex: string, amount: number): string {
  return brighten(hex, -amount);
}
