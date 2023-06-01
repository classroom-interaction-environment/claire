import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { Schema } from '../../../../api/schema/Schema'
import { i18n } from '../../../../api/language/language'
import { formIsValid } from '../../forms/formUtils'
import { CodeInvitation } from '../../../../contexts/classroom/invitations/CodeInvitations'
import { Router } from '../../../../api/routes/Router'
import { Routes } from '../../../../api/routes/Routes'
import './joinClass.html'

const joinClassSchema = Schema.create({
  code: {
    type: String,
    label: () => i18n.get('codeInvitation.code')
  }
}, { tracker: Tracker })

const API = Template.joinClass.setDependencies()

Template.joinClass.helpers({
  loadComplete () {
    return API.initComplete()
  },
  joinClassSchema () {
    return joinClassSchema
  },
  successful () {
    return Template.getState('successful')
  }
})

Template.joinClass.events({
  'closed.bs.modal #global-code-modal' (event, templateInstance) {
    templateInstance.state.set('successful', false)
  },
  'submit #joinClassForm' (event, templateInstance) {
    event.preventDefault()

    const codeDoc = formIsValid(joinClassSchema, 'joinClassForm')
    const { code } = codeDoc

    templateInstance.state.set('submitting', true)
    Meteor.call(CodeInvitation.methods.addToClass.name, { code }, (err) => {
      templateInstance.state.set('submitting', false)
      if (err) {
        API.notify(err)
      }
      else {
        API.notify(true)
        templateInstance.state.set('successful', true)
        Router.go(Routes.root.path())
      }
    })
  }
})
