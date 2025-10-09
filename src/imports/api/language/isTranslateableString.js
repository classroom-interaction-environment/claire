export const isTranslateableString = s => {
  return typeof s === 'string' &&
    s.includes('.') &&
    !s.includes(' ') &&
    !s.startsWith('.') &&
    !s.endsWith('.')
}