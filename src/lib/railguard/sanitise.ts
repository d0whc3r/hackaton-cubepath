/**
 * Returns a sanitised excerpt of the input for safe logging.
 * - Truncates to the first 100 characters.
 * - Replaces all RFC 5322 email addresses with "[REDACTED]".
 * - Replaces all E.164 phone numbers with "[REDACTED]".
 * - Never throws.
 */
export function sanitise(input: string): string {
  try {
    const truncated = input.slice(0, 100)
    const withoutEmails = redactEmails(truncated)
    const withoutPhones = redactPhones(withoutEmails)
    return withoutPhones
  } catch {
    return ''
  }
}

function redactEmails(value: string): string {
  let result = ''
  let cursor = 0
  for (let i = 0; i < value.length; i += 1) {
    if (value.codePointAt(i) !== 64) {
      continue
    }
    let start = i - 1
    while (start >= 0 && isEmailChar(value[start])) {
      start -= 1
    }
    start += 1
    let end = i + 1
    while (end < value.length && isEmailChar(value[end])) {
      end += 1
    }
    if (start >= i || end <= i + 1) {
      continue
    }
    const candidate = value.slice(start, end)
    if (!isLikelyEmail(candidate)) {
      continue
    }
    result += value.slice(cursor, start)
    result += '[REDACTED]'
    cursor = end
    i = end - 1
  }
  if (cursor === 0) {
    return value
  }
  return result + value.slice(cursor)
}

function redactPhones(value: string): string {
  let result = ''
  let cursor = 0
  let i = 0
  while (i < value.length) {
    const char = value[i]
    if (char !== '+' && !isDigit(char)) {
      i += 1
      continue
    }
    const start = i
    const { digits, end, firstIsPlus } = scanPhoneToken(value, start)
    if (digits >= 7 && digits <= 15 && (firstIsPlus || isDigit(value[start]))) {
      result += value.slice(cursor, start)
      result += '[REDACTED]'
      cursor = end
      i = end
      continue
    }
    i += 1
  }
  if (cursor === 0) {
    return value
  }
  return result + value.slice(cursor)
}

function scanPhoneToken(value: string, start: number): { digits: number; end: number; firstIsPlus: boolean } {
  let end = start
  let digits = 0
  let firstIsPlus = false
  while (end < value.length) {
    const current = value[end]
    if (current === '+' && end === start) {
      firstIsPlus = true
      end += 1
      continue
    }
    if (isDigit(current)) {
      digits += 1
      end += 1
      continue
    }
    if (isPhoneSeparator(current)) {
      end += 1
      continue
    }
    break
  }
  return { digits, end, firstIsPlus }
}

function isLikelyEmail(value: string): boolean {
  const at = value.indexOf('@')
  if (at <= 0 || at !== value.lastIndexOf('@') || at >= value.length - 1) {
    return false
  }
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  if (!local || !domain) {
    return false
  }
  if (!isLocalPart(local) || !isDomainPart(domain)) {
    return false
  }
  const dot = domain.lastIndexOf('.')
  if (dot <= 0 || dot >= domain.length - 2) {
    return false
  }
  for (let i = dot + 1; i < domain.length; i += 1) {
    const code = domain.codePointAt(i) ?? 0
    if ((code < 65 || code > 90) && (code < 97 || code > 122)) {
      return false
    }
  }
  return true
}

function isLocalPart(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.codePointAt(i) ?? 0
    const isLower = code >= 97 && code <= 122
    const isUpper = code >= 65 && code <= 90
    const isNumber = code >= 48 && code <= 57
    if (isLower || isUpper || isNumber) {
      continue
    }
    if (value[i] === '.' || value[i] === '_' || value[i] === '%' || value[i] === '+' || value[i] === '-') {
      continue
    }
    return false
  }
  return true
}

function isDomainPart(value: string): boolean {
  if (value.startsWith('.') || value.endsWith('.') || value.includes('..')) {
    return false
  }
  for (let i = 0; i < value.length; i += 1) {
    const code = value.codePointAt(i) ?? 0
    const isLower = code >= 97 && code <= 122
    const isUpper = code >= 65 && code <= 90
    const isNumber = code >= 48 && code <= 57
    if (isLower || isUpper || isNumber) {
      continue
    }
    if (value[i] === '.' || value[i] === '-') {
      continue
    }
    return false
  }
  return true
}

function isDigit(char: string): boolean {
  const code = char.codePointAt(0) ?? 0
  return code >= 48 && code <= 57
}

function isPhoneSeparator(char: string): boolean {
  return char === ' ' || char === '-' || char === '(' || char === ')' || char === '.'
}

function isEmailChar(char: string): boolean {
  if (isDigit(char)) {
    return true
  }
  const code = char.codePointAt(0) ?? 0
  const isLower = code >= 97 && code <= 122
  const isUpper = code >= 65 && code <= 90
  return (
    isLower || isUpper || char === '.' || char === '_' || char === '%' || char === '+' || char === '-' || char === '@'
  )
}
