import { Template } from 'meteor/templating'
import { AdminViewStates } from './adminViewStates'
import { Form } from '../../components/forms/Form'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { getQueryParam } from '../../../api/routes/params/getQueryParam'
import { setQueryParams } from '../../../api/routes/params/setQueryParams'
import adminLanguage from './i18n/adminLanguage'
import '../../layout/submenu/submenu'
import '../../generic/templateLoader/TemplateLoader'
import './admin.html'

const formInitialized = Form.initialized()

const API = Template.admin.setDependencies({
  language: adminLanguage
})

Template.admin.onCreated(function () {
  const instance = this

  instance.autorun(computation => {
    const userId = Meteor.userId()
    if (!userId) {
      return
    }
    instance.viewStates = Object.values(AdminViewStates).filter(view => UserUtils.hasAtLeastRole(userId, view.role))
    instance.state.set('viewStatesReady', true)
    computation.stop()
  })

  instance.autorun(() => {
    const view = getQueryParam('view')
    const currentView = AdminViewStates[view] || AdminViewStates.users

    instance.state.set('currentView', currentView.name)
  })
})

Template.admin.helpers({
  loadComplete () {
    return formInitialized.get() && API.initComplete() && Template.getState('viewStatesReady')
  },
  submenuData () {
    const { viewStates } = Template.instance()
    return viewStates && {
      views: viewStates,
      queryParam: 'view',
      getQueryParam: getQueryParam,
      updateQueryParam: setQueryParams
    }
  },
  templateAtts () {
    const currentView = Template.getState('currentView')
    return AdminViewStates[currentView]
  }
})
