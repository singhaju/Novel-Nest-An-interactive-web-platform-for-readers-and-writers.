export const GENRE_OPTIONS = [
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Mystery",
  "Thriller",
  "Horror",
  "Historical",
  "Adventure",
  "Young Adult",
  "Urban Fantasy",
  "LitRPG",
  "Slice of Life",
  "Drama",
  "Comedy",
  "Crime",
  "Supernatural",
  "Dystopian",
  "Post-Apocalyptic",
  "Steampunk",
  "Non-fiction",
] as const

export const DEFAULT_VISIBLE_GENRE_COUNT = 6

export function parseGenresFromString(source?: string | null): string[] {
  if (!source) return []
  return source
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}
