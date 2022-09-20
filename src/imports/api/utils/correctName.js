const uppercase = x => x.toUpperCase()

const word = /\w/
const whiteSpace = /\s+/g

export const correctName = (name, { trim, upperCase } = {}) => {
  if (!name) {
    return name
  }

  let copy = name

  if (trim) {
    copy = copy.trim().replace(whiteSpace, ' ')
  }

  if (upperCase) {
    copy = copy.replace(word, uppercase)
  }

  return copy
}
