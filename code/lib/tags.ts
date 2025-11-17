// Shared tag utilities used by the home discovery cards and the /novels tag pages

const TAG_ALIASES: Record<string, string> = {
  "sci fi": "science fiction",
  "sci-fi": "science fiction",
  "science-fiction": "science fiction",
  "lit rpg": "litrpg",
  "lit-rpg": "litrpg",
  "young-adult": "young adult",
  ya: "young adult",
  // map some common discovery labels to canonical tags
  "epic fantasy": "fantasy",
  "slow burn romance": "romance",
  "mystery & thriller": "thriller",
  "mystery and thriller": "thriller",
}

const TAG_DISPLAY_OVERRIDES: Record<string, string> = {
  "science fiction": "Science Fiction",
  litrpg: "LitRPG",
  "slice of life": "Slice of Life",
  "young adult": "Young Adult",
}

export function normalizeTag(raw: string | undefined | null): string | null {
  if (!raw) return null

  let normalized = String(raw)
    .toLowerCase()
    .replace(/[[\]"]+/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!normalized) return null

  normalized = TAG_ALIASES[normalized] ?? normalized
  return normalized
}

export function slugify(tag: string): string {
  return String(tag)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function formatTagLabel(tag: string): string {
  if (TAG_DISPLAY_OVERRIDES[tag]) return TAG_DISPLAY_OVERRIDES[tag]

  return tag
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export default {
  normalizeTag,
  slugify,
  formatTagLabel,
}
