import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { dataTarget } from '../../utils/dataTarget'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import './submenu.html'

const getQueryParamKey = instance => instance.data.queryParam || 'v'

/**
 * submenu is a generic layout component that renders a nav menu
 * for the corresponding view states and handles their activation and
 * queryParam states.
 *
 * @template submenu
 * @param views {Array<ViewObject>} An array of Objects
 * @param views.$.name {String} name/key of the view
 * @param views.$.label {String} i18n compatible title of the view
 * @param queryParam {String} the key that is used to get/set the query param
 * @param getQueryParam {Function} function to get a query param value
 */

Template.submenu.onCreated(function () {
  const instance = this

  const { onViewSelected, views } = instance.data
  instance.getViewByName = name => views.find(view => view.name === name)

  const queryParamKey = getQueryParamKey(instance)
  const initialView = views[0]?.name
  const { getQueryParam } = instance.data

  // if there are no reactive queryParams supported we simply skip
  // and use the default internal instance.state variant
  if (typeof getQueryParam !== 'function') {
    instance.state.set('current', initialView)
    onViewSelected && onViewSelected(initialView)
    return
  }

  instance.autorun(() => {
    const queryParam = getQueryParam(queryParamKey)
    const currentQueryParam = instance.state.get('current')

    if (!queryParam) {
      instance.state.set('current', initialView)
      onViewSelected && onViewSelected(initialView)
      return
    }

    if (queryParam !== currentQueryParam && instance.getViewByName(queryParam)) {
      instance.state.set('current', queryParam)
      onViewSelected && onViewSelected(queryParam)
    }
  })
})

Template.submenu.helpers({
  isCurrent (targetId) {
    return targetId && Template.getState('current') === targetId
  },
  currentView () {
    const instance = Template.instance()
    const current = instance.state.get('current')
    return instance.getViewByName(current)
  },
  navAtts () {
    const { data } = Template.instance()
    console.debug('navAtts', data)
    const justified = data.justified || data?.nav?.justified
      ? 'nav-justified'
      : ''
    const ulClass = data.class || data?.nav?.class || ''
    return {
      class: `nav nav-tabs ${justified} ${ulClass}`
    }
  },
  visible (view, user) {
    return !view.roles || UserUtils.hasRole(user._id, view.roles, user.institution)
  }
})

Template.submenu.events({
  'click .submenu-tab' (event, templateInstance) {
    event.preventDefault()
    const current = dataTarget(event, templateInstance)
    const { updateQueryParam, onViewSelected } = templateInstance.data

    if (typeof updateQueryParam !== 'function') {
      templateInstance.state.set({ current })
      onViewSelected && onViewSelected(current)
    }

    const queryParamKey = getQueryParamKey(templateInstance)
    const updateObj = { [queryParamKey]: current }
    updateQueryParam(updateObj)
  }
})
