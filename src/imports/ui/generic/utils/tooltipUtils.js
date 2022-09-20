export const showTooltip = function showTooltip (event, templateInstance) {
  const { data } = templateInstance
  if (!data.title || data.tooltip === false) {
    return //event.preventDefault()
  }
  const $target = templateInstance.$(event.currentTarget)
  $target.tooltip('show')
}

export const hideTooltip = function hideTooltip (event, templateInstance) {
  const { data } = templateInstance
  if (!data.title || data.tooltip === false) return //event.preventDefault()
  templateInstance.$(event.currentTarget).tooltip('hide')
}

const isTarget = (target, name) => typeof target.className === 'string' && target.className.includes(name)

/**
 * Generates default event-based logic for showing / hiding tooltips on a given component.
 * @param name The css selector name of the component, like .class or #id
 * @returns {{}} Object of mapped events for this component
 */
export const toolTipEvents = ({ name }) => {
  const cleanedName = name.substring(1, name.length)
  return {
    [`mouseenter ${name}`] (event, templateInstance) {
      if (!templateInstance.data.blocked && isTarget(event.target, cleanedName)) {
        showTooltip(event, templateInstance)
      }
    },
    [`mouseleave ${name}`] (event, templateInstance) {
      if (isTarget(event.target, cleanedName)) {
        hideTooltip(event, templateInstance)
      }
    },
    [`focus ${name}`] (event, templateInstance) {
      if (!templateInstance.data.blocked && isTarget(event.target, cleanedName)) {
        showTooltip(event, templateInstance)
      }
    },
    [`blur ${name}`] (event, templateInstance) {
      if (isTarget(event.target, cleanedName)) {
        hideTooltip(event, templateInstance)
      }
    },
    [`click ${name}`] (event, templateInstance) {
      const $target = templateInstance.$(event.currentTarget)
      if (!templateInstance.data.form && !$target.prop('form')) {
        hideTooltip(event, templateInstance)
      }
    }
  }
}
