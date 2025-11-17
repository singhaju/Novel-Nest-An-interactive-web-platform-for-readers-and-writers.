export type PasswordRequirementKey = "length" | "uppercase" | "lowercase" | "number" | "special"

export interface PasswordRequirement {
  key: PasswordRequirementKey
  label: string
  hint?: string
}

export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
  { key: "length", label: "At least 8 characters" },
  { key: "uppercase", label: "One uppercase letter" },
  { key: "lowercase", label: "One lowercase letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character" },
] as const

export type PasswordCheckResult = Record<PasswordRequirementKey, boolean>

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/

export function evaluatePassword(password: string): PasswordCheckResult {
  const value = password ?? ""
  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: SPECIAL_CHAR_REGEX.test(value),
  }
}

export function isPasswordStrong(password: string): boolean {
  const checks = evaluatePassword(password)
  return Object.values(checks).every(Boolean)
}
