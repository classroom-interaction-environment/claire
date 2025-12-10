export const dataTarget = (event, templateInstance = null, field = 'target') => {
  const fieldName = typeof templateInstance === 'string' ? templateInstance : field
  if (!event || !event.currentTarget) throw new Error('Expected event with target')
  let value = event.currentTarget.dataset[fieldName]

  // fallback if case we want to get values like id, class, etc.
  if (typeof value === 'undefined') {
    value = event.currentTarget[fieldName]
  }

  // jQuery fallback
  if (typeof value === 'undefined') {
    value = templateInstance.$(event.currentTarget).data(fieldName)
  }

  return value
}
