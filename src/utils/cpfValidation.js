export function normalizeCpf(value = '') {
  return String(value ?? '').replace(/\D/g, '')
}

export function formatCpf(value = '') {
  const digits = normalizeCpf(value)

  if (!digits) {
    return ''
  }

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

export function isValidCpf(value = '') {
  const digits = normalizeCpf(value)

  if (digits.length !== 11 || /^([0-9])\1+$/.test(digits)) {
    return false
  }

  let sum = 0

  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits.charAt(index)) * (10 - index)
  }

  let firstVerifierDigit = 11 - (sum % 11)

  if (firstVerifierDigit >= 10) {
    firstVerifierDigit = 0
  }

  if (Number(digits.charAt(9)) !== firstVerifierDigit) {
    return false
  }

  sum = 0

  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits.charAt(index)) * (11 - index)
  }

  let secondVerifierDigit = 11 - (sum % 11)

  if (secondVerifierDigit >= 10) {
    secondVerifierDigit = 0
  }

  return Number(digits.charAt(10)) === secondVerifierDigit
}
