import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { formIsValid, formReset } from '../formUtils'
import dely from 'dely'
import './createForm.html'

const by300 = dely(300)

const API = Template.createForm.setDependencies()

Template.createForm.helpers({
  submitting () {
    return Template.getState('submitting')
  }
})

Template.createForm.events({
  'click .create-form-button' (event) {
    event.preventDefault()
    API.showModal('createModal')
  },
  'submit form' (event, templateInstance) {
    event.preventDefault()
    const formId = templateInstance.data.id
    const formSchema = templateInstance.data.schema
    const insertDoc = formIsValid(formSchema, formId)
    if (!insertDoc) return

    // start submitting
    templateInstance.state.set('submitting', true)
    const method = templateInstance.data.method

    Meteor.call(method, insertDoc, by300((err, result) => {
      templateInstance.state.set('submitting', true)
      if (err) return API.notify(err)

      const enableSuccessNotification = templateInstance.data.notifySuccess !== false
      if (enableSuccessNotification) API.notify(true)

      templateInstance.state.set('result', result)
      API.hideModal('createModal')
    }))
  },
  'hidden.bs.modal #createModal' (event, templateInstance) {
    if (templateInstance.onCreated) {
      const result = templateInstance.state.get('result')
      templateInstance.onCreated(result)
    }

    // clean up
    const formId = templateInstance.data.id
    formReset(formId)
    templateInstance.state.set('result', null)
  }
})
