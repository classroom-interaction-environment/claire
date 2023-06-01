import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { i18n } from '../../../api/language/language'
import { Routes } from '../../../api/routes/Routes'
import { CodeInvitation } from '../../../contexts/classroom/invitations/CodeInvitations'
import { Schema } from '../../../api/schema/Schema'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { getSchemaField } from '../../utils/form/getSchemaField'
import { formIsValid, formReset } from '../../components/forms/formUtils'
import { dataTarget } from '../../utils/dataTarget'
import { cursor } from '../../../api/utils/cursor'
import { emailLink } from '../../../api/utils/email/emailLink'
import { confirmDialog } from '../../components/confirm/confirm'
import { delayedCallback } from '../../utils/delayedCallback'
import { callMethod } from '../../controllers/document/callMethod'
import { getCollection } from '../../../api/utils/getCollection'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import '../../components/invitation/rowRenderer/rowRenderer'
import './inviteUsers.html'

const API = Template.inviteUsers.setDependencies({
  contexts: [CodeInvitation, SchoolClass, Beamer]
})

const isNewClass = () => getSchemaField('classId') === 'new'
const codeSchemaDef = Object.assign({}, CodeInvitation.createCodeSchema, {
  title: {
    type: String,
    label: SchoolClass.schema.title.label,
    optional: () => !isNewClass(),
    autoform: {
      type: () => {
        return isNewClass()
          ? 'text'
          : 'hidden'
      }
    }
  }
})

const createInvitationSchema = Schema.create(codeSchemaDef)
const onError = err => API.fatal(err)

Template.inviteUsers.onCreated(function () {
  const instance = this

  API.subscribe({
    name: CodeInvitation.publications.myCodes.name,
    key: 'inviteUsers',
    callbacks: {
      onReady () {
        instance.state.set('codesComplete', true)
      },
      onError
    }
  })

  loadIntoCollection({
    name: SchoolClass.methods.my,
    collection: getLocalCollection(SchoolClass.name),
    failure: API.notify,
    success: () => instance.state.set('myClassesSubscriptionsReady', true)
  })
})

Template.inviteUsers.onDestroyed(function () {
  API.dispose('inviteUsers')
})

Template.inviteUsers.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('codesComplete') && instance.state.get('myClassesSubscriptionsReady')
  },
  codes () {
    return cursor(() => getCollection(CodeInvitation.name).find({}, { sort: { createdAt: -1 } }))
  },
  toDate (time) {
    return new Date(time).toLocaleString()
  },
  timeLeft (codeId) {
    return Template.getState(codeId)
  },
  displayCodeRoute (code) {
    return Routes.codeInvitation.toRoute(code)
  },
  createInvitationSchema () {
    return createInvitationSchema
  },
  submitting () {
    return Template.getState('submitting')
  },
  deleting (targetId) {
    return Template.getState('deleting') === targetId
  },
  getLink (docId) {
    const invitationDoc = getCollection(CodeInvitation.name).findOne(docId)
    const queryParams = CodeInvitation.helpers.createURLQuery(invitationDoc)
    const invitationRoute = Routes.codeRegister.path(queryParams)
    const url = Meteor.absoluteUrl()
    return url.substring(0, url.length - 1) + invitationRoute
  },
  encodeMail (link) {
    const id = Template.getState('currentDoc')
    const invitationDoc = getCollection(CodeInvitation.name).findOne(id)
    const user = Meteor.user()
    const to = (invitationDoc && invitationDoc.firstName && invitationDoc.lastName)
      ? ` ${invitationDoc.firstName} ${invitationDoc.lastName}` // first char needs to be a space! See translation file
      : ''
    const from = `${user.firstName} ${user.lastName}`
    const subject = i18n.get('codeInvitation.emailSubject')
    const body = i18n.get('codeInvitation.emailBody', { to, from, link })
    return emailLink({ user, from, subject, body })
  },
  isExpired (invitationDoc) {
    return CodeInvitation.helpers.isExpired(invitationDoc)
  },
  currentDoc () {
    const id = Template.getState('currentDoc')
    return getCollection(CodeInvitation.name).findOne(id)
  },
  refreshDoc () {
    return Template.getState('refreshDoc')
  },
  activeCodes (codes) {
    return codes && codes.fetch().filter(doc => CodeInvitation.helpers.isPending(doc))
  },
  expiredCodes (codes) {
    return codes && codes.fetch().filter(doc => !CodeInvitation.helpers.isPending(doc)).sort((a, b) => {
      const val1 = CodeInvitation.helpers.isComplete(a) ? 1 : 0
      const val2 = CodeInvitation.helpers.isComplete(b) ? 1 : 0
      return val2 - val1
    })
  },
  codeToBeamer (code) {
    return Template.instance().state.get('codeToBeamer') === code
  },
  beamerDisabled () {
    return !Beamer.actions.get()
  }
})

Template.inviteUsers.events({
  'click .remove-invitation-button' (event, templateInstance) {
    event.preventDefault()
    confirmDialog({ text: 'codeInvitation.confirmRemove', codeRequired: true })
      .then(result => {
        if (!result) return
        const target = dataTarget(event, templateInstance)
        templateInstance.state.set('deleting', target)
        Meteor.call(CodeInvitation.methods.forceExpire.name, { _id: target }, (err, res) => {
          templateInstance.state.set('deleting', null)
          if (err) {
            API.notify(err)
          }
        })
      })
      .catch(e => API.notify(e))
  },
  'click .delete-invitation-button' (event, templateInstance) {
    event.preventDefault()

    confirmDialog({ text: 'codeInvitation.confirmDelete', codeRequired: true })
      .then(result => {
        if (!result) return
        const target = dataTarget(event, templateInstance)
        templateInstance.state.set('deleting', target)
        Meteor.call(CodeInvitation.methods.remove.name, { _id: target }, (err, res) => {
          templateInstance.state.set('deleting', null)
          if (err) {
            API.notify(err)
          }
          else {
            API.notify('form.removeComplete')
          }
        })
      })
      .catch(e => API.notify(e))
  },
  'click .create-invitation-link-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    templateInstance.state.set('currentDoc', target)
    templateInstance.$('#createLinkModal').modal('show')
  },
  'submit #createInvitationForm': async function (event, templateInstance) {
    event.preventDefault()

    const insertDoc = formIsValid(createInvitationSchema, 'createInvitationForm')
    if (!insertDoc) { return }

    // we need to check if there has been no school class created
    // then classId won't be an id but the name of the new schoolClass

    const { classId, title, role } = insertDoc
    const createNewClass = role === UserUtils.roles.student && (!classId || classId === 'new')

    if (createNewClass) {
      insertDoc.classId = await callMethod({
        name: SchoolClass.methods.create,
        args: { title },
        prepare: () => templateInstance.state.set('submitting', true),
        failure: err => API.notify(err)
      })

      delete insertDoc.title
    }

    await callMethod({
      name: CodeInvitation.methods.create,
      args: insertDoc,
      prepare: () => templateInstance.state.set('submitting', true),
      receive: () => templateInstance.state.set('submitting', false),
      failure: err => API.notify(err),
      success: () => {
        API.notify('form.insertComplete')
        templateInstance.$('#createInvitationModal').modal('hide')
      }
    })
  },
  'hidden.bs.modal' () {
    formReset('createInvitationForm')
  },
  'click .create-invitation-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#createInvitationModal').modal('show')
  },
  'click .copy-to-clipboard-button' (event, templateInstance) {
    templateInstance.$('#createLinkModal').modal('hide')
    setTimeout(() => API.notify('actions.copied'), 200)
  },
  'click .refresh-invitation-button' (event, templateInstance) {
    event.preventDefault()
    const codeDocId = dataTarget(event, templateInstance)
    const codeDoc = getCollection(CodeInvitation.name).findOne(codeDocId)
    templateInstance.state.set('refreshDoc', codeDoc)
    templateInstance.$('#createLinkModal').modal('hide')
    setTimeout(() => {
      templateInstance.$('#createInvitationModal').modal('show')
    }, 300)
  },
  'click .create-qr-button' (event, templateInstance) {
    event.preventDefault()
    const code = dataTarget(event, templateInstance)
    templateInstance.state.set('codeToBeamer', code)
    const beamerDoc = Beamer.doc.get()
    const updateCode = beamerDoc.invitationCode === code
      ? null
      : code
    Beamer.doc.code(updateCode, delayedCallback(300, (err) => {
      templateInstance.state.set('codeToBeamer', null)
      if (err) {
        API.notify(err)
      }
      else {
        API.notify()
      }
    }))
  }
})
