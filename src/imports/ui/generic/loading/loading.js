import { Template } from 'meteor/templating'
import '../icon/icon'
import './loading.html'

export const loadingClassName = 'loading-data-notification'

const getIconByType = type => {
  if (type === 'data') {
    return 'fa-cog fa-spin'
  }

  return 'fa-spinner fa-pulse'
}

const getLabelByType = type => {
  if (type === 'data') {
    return 'common.loadData'
  }

  if (type === 'template' || type === 'view') {
    return 'common.loadTemplate'
  }

  return 'common.loading'
}

Template.loading.helpers({
  divAtts (size = 4) {
    const data = Template.instance()?.data || {}
    const alertSize = `p-${size}`
    const customClass = data.class || ''
    const className = `alert alert-info ${alertSize} text-center text-md-left ${loadingClassName} ${customClass}`
    return {
      class: className
    }
  },
  iconAtts (type = '') {
    const typeClass = getIconByType(type)
    const className = `fa fas ${typeClass} fa-fw`
    return {
      class: className
    }
  },
  label (type = '') {
    return getLabelByType(type)
  }
})
