import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'

import { CodeInvitation } from '../../../contexts/classroom/invitations/CodeInvitations'
import { Schema } from '../../../api/schema/Schema'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { MyStudents } from '../../controllers/MyStudents'
import { Routes } from '../../../api/routes/Routes'
import { i18n } from '../../../api/language/language'
import { Beamer } from '../../../contexts/beamer/Beamer'

import { formIsValid } from '../forms/formUtils'
import { getCollection } from '../../../api/utils/getCollection'
import { dataTarget } from '../../utils/dataTarget'
import { emailLink } from '../../../api/utils/email/emailLink'
import { delayedCallback } from '../../utils/delayedCallback'
import '../../generic/nodocs/nodocs'
import '../invitation/rowRenderer/rowRenderer'
import '../invitation/coderender/coderenderer'
import './inviteStudents.html'

const API = Template.inviteStudents.setDependencies({
  contexts: [CodeInvitation, Beamer]
})

const hidden = obj => Object.assign({}, obj, { autoform: { type: 'hidden' } })

const inviteSchema = Schema.create({
  maxUsers: CodeInvitation.schema.maxUsers,
  expires: CodeInvitation.schema.expires,
  role: hidden(CodeInvitation.createCodeSchema.role),
  institution: hidden(CodeInvitation.createCodeSchema.institution),
  classId: hidden(CodeInvitation.createCodeSchema.classId)
}, { tracker: Tracker })

const CodeInvitationCollection = getCollection(CodeInvitation.name)

const Times = {
  _d: 1000 * 60 * 60 * 24,
  _h: 1000 * 60 * 60,
  _m: 1000 * 60,
  _s: 1000,
  d: value => Math.floor(value / Times._d),
  h: value => Math.floor((value / Times._h) % 24),
  m: value => Math.floor((value / Times._m) % 60),
  s: value => Math.floor((value / Times._s) % 60),
  toString: (d = 0, h = 0, m = 0, s = 0) => `${d}d ${h}h ${m}m ${s}s`
}

Template.inviteStudents.onCreated(function () {
  const instance = this
  instance.state.set('countDown', Times.toString())

  instance.endCountdown = () => {
    if (instance.countDown) {
      clearInterval(instance.countDown)
      instance.countDown = undefined
    }
  }

  instance.startCountdown = ({ createdAt, expires }) => {
    instance.endCountdown()
    instance.countDown = setInterval(() => {
      const timeLeft = CodeInvitation.helpers.timeLeft(createdAt, expires)
      if (timeLeft <= 0) {
        instance.endCountdown()
        instance.state.set('countDown', i18n.get('codeInvitation.expired'))
        return
      }

      const d = Times.d(timeLeft)
      const h = Times.h(timeLeft)
      const m = Times.m(timeLeft)
      const s = Times.s(timeLeft)
      instance.state.set('countDown', Times.toString(d, h, m, s))
    }, 1000)
  }

  instance.getLink = (invitationDoc) => {
    const queryParams = CodeInvitation.helpers.createURLQuery(invitationDoc)
    const invitationRoute = Routes.codeRegister.path(queryParams)
    const url = Meteor.absoluteUrl()
    return url.substring(0, url.length - 1) + invitationRoute
  }

  instance.getEncodedEmail = (invitationDoc, link) => {
    const user = Meteor.user()
    const to = (invitationDoc && invitationDoc.firstName && invitationDoc.lastName)
      ? ` ${invitationDoc.firstName} ${invitationDoc.lastName}` // first char needs to be a space! See translation file
      : ''
    const from = `${user.firstName} ${user.lastName}`
    const subject = i18n.get('codeInvitation.emailSubject')
    const body = i18n.get('codeInvitation.emailBody', { to, from, link })
    return emailLink({ user, from, subject, body })
  }

  // set students and class
  instance.autorun(() => {
    const data = Template.currentData()
    const classId = data && data.classId
    if (!classId) {
      instance.state.set('usersLoaded', false)
      instance.state.set('loadComplete', false)
      return
    }

    MyStudents.setClass(classId, () => {
      instance.state.set('usersLoaded', true)
    })
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const classId = data && data.classId
    if (!classId) return

    API.subscribe({
      name: CodeInvitation.publications.getInvitationForClass,
      args: { classId },
      key: 'inviteStudents',
      callbacks: {
        onError: API.notify,
        onReady: () => {
          // get the code doc and check if it's already expired or complete
          // otherwise start a countdown timer that updates the time left until expirarion
          const codeDoc = CodeInvitationCollection.findOne({ classId }, { sort: { createdAt: -1 } })

          // fail silent and lets generate a new one if none exist
          if (!codeDoc) {
            instance.state.set('registeredUsers', [])
            instance.state.set('codeDoc', null)
            instance.state.set('loadComplete', true)
            return
          }

          const invitationExpiredOrComplete = codeDoc && (CodeInvitation.helpers.isExpired(codeDoc) || CodeInvitation.helpers.isComplete(codeDoc))
          const registeredUsers = (codeDoc.registeredUsers || []).map(userId => {
            const user = Meteor.users.findOne(userId)
            return {
              registered: !!user,
              firstName: user?.firstName,
              lastName: user?.lastName,
              createdAt: user?.createdAt
            }
          })

          const link = !invitationExpiredOrComplete && instance.getLink(codeDoc)
          const encodedEmail = link && instance.getEncodedEmail(codeDoc, link)

          instance.state.set({
            codeDoc,
            invitationExpiredOrComplete,
            registeredUsers,
            link,
            encodedEmail,
            loadComplete: true
          })
        }
      }
    })
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const codeDoc = instance.state.get('codeDoc')
    if (data.countDownActive && codeDoc) {
      instance.startCountdown(codeDoc)
    }
    else {
      instance.endCountdown()
    }
  })
})

Template.inviteStudents.onDestroyed(function () {
  const instance = this
  instance.endCountdown()
  API.dispose('inviteStudents')
})

Template.inviteStudents.helpers({
  activeInvitation () {
    const instance = Template.instance()
    if (instance.state.get('showForm')) return

    const data = instance.data
    const { classId } = data
    if (!classId) return
    return CodeInvitationCollection.findOne({ classId }, { sort: { createdAt: -1 } })
  },
  expiredOrComplete () {
    return Template.getState('invitationExpiredOrComplete')
  },
  getLink (docId) {
    return Template.getState('link')
  },
  getLinkOption (link) {
    const user = Meteor.user()
    const from = `${user.firstName} ${user.lastName}`
    return { link, from }
  },
  encodeMail (link) {
    return Template.getState('encodedEmail')
  },
  inviteSchema () {
    return inviteSchema
  },
  inviteDoc () {
    const data = Template.instance().data
    const { classId } = data
    const { institution } = data
    return { classId, role: UserUtils.roles.student, institution }
  },
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('loadComplete') && instance.state.get('usersLoaded')
  },
  showList () {
    return Template.getState('showList')
  },
  showLink () {
    return Template.getState('showLink')
  },
  registeredUsers () {
    return Template.getState('registeredUsers')
  },
  isExpired (invitationDoc) {
    return CodeInvitation.helpers.isExpired(invitationDoc)
  },
  creating () {
    return Template.getState('creating')
  },
  updateBeamer () {
    return Template.instance().state.get('updateBeamer')
  },
  beamerDisabled () {
    return !Beamer.actions.get()
  },
  countDown () {
    return Template.instance().state.get('countDown')
  },
  forceInvalid () {
    return Template.instance().state.get('forceInvalid')
  }
})

Template.inviteStudents.events({
  'click .show-invitationlist-button' (event, templateInstannce) {
    event.preventDefault()
    const showList = templateInstannce.state.get('showList')
    templateInstannce.state.set('showList', !showList)
  },
  'click .show-invitation-link-button' (event, templateInstannce) {
    event.preventDefault()
    const showLink = templateInstannce.state.get('showLink')
    templateInstannce.state.set('showLink', !showLink)
  },
  'submit #inviteStudentsForm' (event, templateInstance) {
    event.preventDefault()

    const insertDoc = formIsValid(inviteSchema, 'inviteStudentsForm')
    if (!insertDoc) return

    templateInstance.state.set('creating', true)
    const { classId } = templateInstance.data
    const { institution } = templateInstance.data
    const finalDoc = Object.assign({}, insertDoc, { classId, institution })

    Meteor.call(CodeInvitation.methods.create.name, finalDoc, (err) => {
      templateInstance.state.set('creating', false)
      if (err) {
        return API.notify(err)
      }
      else {
        API.notify(true)
        templateInstance.state.set('showForm', false)
        templateInstance.state.set('invitationExpiredOrComplete', false)
      }
    })
  },
  'click .refresh-invitation-button' (event, templateInstance) {
    event.preventDefault()
    const codeDoc = templateInstance.state.get('codeDoc')

    // if already expired etc. just show the new form
    if (!codeDoc || CodeInvitation.helpers.isExpired(codeDoc) || CodeInvitation.helpers.isComplete(codeDoc)) {
      return templateInstance.state.set('showForm', true)
    }

    // otherwise force expire the doc
    const { _id } = codeDoc
    templateInstance.state.set('forceInvalid', true)
    Meteor.call(CodeInvitation.methods.forceExpire.name, { _id }, delayedCallback(300, (err) => {
      templateInstance.state.set('forceInvalid', false)
      if (err) return API.notify(err)
      templateInstance.state.set('showForm', true)
    }))
  },
  'click .code-to-beamer-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('updateBeamer', true)
    const code = dataTarget(event, templateInstance, 'code')
    const beamerDoc = Beamer.doc.get()

    const invitationCode = beamerDoc.invitationCode === code ? null : code
    Beamer.doc.code(invitationCode, delayedCallback(300, (err) => {
      templateInstance.state.set('updateBeamer', false)
      if (err) {
        API.notify(err)
      }
      else {
        API.notify(true)
      }
    }))
  }
})
