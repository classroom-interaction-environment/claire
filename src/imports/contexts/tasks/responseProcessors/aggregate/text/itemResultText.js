import { Template } from 'meteor/templating'
import '../../../../../ui/generic/nodocs/nodocs'
import responseLanguage from '../../i18n/responseLanguage'
import './itemResultText.html'

const API = Template.itemResultText.setDependencies({
  language: responseLanguage
})

Template.itemResultText.onCreated(function () {
  const instance = this
  const { api } = instance.data

  instance.state.setDefault('showHiddenAnswers', false)

  const toggleAllUsersHandler = event => {
    event.preventDefault()
    const showHidden = instance.state.get('showHiddenAnswers')
    instance.state.set('showHiddenAnswers', !showHidden)
  }

  instance.autorun(() => {
    const showsHidden = instance.state.get('showHiddenAnswers')
    const textDoc = instance.state.get('textDoc')
    const shouldBeVisible = textDoc?.hiddenAnswers?.length > 0

    api.registerAction({
      id: 'toggleHiddenUsers',
      type: 'outline-primary',
      icon: showsHidden ? 'eye-slash' : 'eye',
      label: showsHidden ? 'response.hideAnswers' : 'response.showAnswers',
      visible: shouldBeVisible,
      handler: toggleAllUsersHandler
    })
  })

  instance.autorun(() => {
    if (!api.subscriptions.ready()) {
      return
    }

    const textDoc = api.document()
    instance.state.set({ textDoc })
  })
})

Template.itemResultText.helpers({
  showUser (userId) {
    const textDoc = Template.getState('textDoc')
    return textDoc?.visibleUsers?.includes(userId)
  },
  answerIsHidden (userId) {
    const instance = Template.instance()
    const showHiddenAnswers = instance.state.get('showHiddenAnswers')
    if (showHiddenAnswers) return false

    const textDoc = Template.getState('textDoc')
    return textDoc?.hiddenAnswers?.includes(userId)
  },
  shouldBeHidden (userId) {
    const textDoc = Template.getState('textDoc')
    return textDoc?.hiddenAnswers?.includes(userId)
  },
  saving (id) {
    return id && Template.getState('saving') === id
  }
})

Template.itemResultText.events({
  'click .toggle-user-button' (event, templateInstance) {
    event.preventDefault()

    const userId = templateInstance.data.api.dataTarget(event, templateInstance)
    const textDoc = templateInstance.state.get('textDoc') || {}
    const visibleUsers = (textDoc.visibleUsers || []).filter(entry => !!entry)

    const userIndex = visibleUsers.indexOf(userId)
    if (userIndex === -1) {
      visibleUsers.push(userId)
    }
    else {
      visibleUsers.splice(userIndex, 1)
    }
    templateInstance.data.api.save({
      doc: { visibleUsers },
      prepare: () => templateInstance.state.set('saving', userId),
      receive: () => templateInstance.state.set('saving', null),
      failure: API.notify
    })
  },
  'click .toggle-response-button' (event, templateInstance) {
    event.preventDefault()

    const userId = templateInstance.data.api.dataTarget(event, templateInstance)
    const textDoc = templateInstance.state.get('textDoc') || {}
    const hiddenAnswers = (textDoc.hiddenAnswers || []).filter(entry => !!entry)

    const userIndex = hiddenAnswers.indexOf(userId)
    if (userIndex === -1) {
      hiddenAnswers.push(userId)
    }
    else {
      hiddenAnswers.splice(userIndex, 1)
    }
    templateInstance.data.api.save({
      doc: { hiddenAnswers },
      prepare: () => templateInstance.state.set('saving', userId),
      receive: () => templateInstance.state.set('saving', null),
      failure: API.notify
    })
  }
})
