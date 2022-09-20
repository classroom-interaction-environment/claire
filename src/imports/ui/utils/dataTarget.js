export const dataTarget = (event, templateInstance, field = 'target') => {
  if (!event || !event.currentTarget) throw new Error('Expected event with target')
  let value = event.currentTarget.dataset[field]

  // fallback if case we want to get values like id, class, etc.
  if (typeof value === 'undefined') {
    value = event.currentTarget[field]
  }

  // jQuery fallback
  if (typeof value === 'undefined') {
    value = templateInstance.$(event.currentTarget).data(field)
  }

  return value
}
