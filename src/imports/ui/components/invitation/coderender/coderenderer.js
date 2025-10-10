import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Routes } from '../../../../api/routes/Routes'
import { createInvitationURLQuery } from '../../../../contexts/classroom/invitations/url/createInvitationURLQuery'
import QRCode from 'qrcode'
import './coderender.html'

const API = Template.codeRender.setDependencies()

Template.codeRender.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    instance.state.set('loadComplete', false)
    const data = Template.currentData()
    const { code } = data
    if (!code) return

    const codeUrlQuery = createInvitationURLQuery({ code })
    const invitationRoute = Routes.codeRegister.path(codeUrlQuery)
    const url = Meteor.absoluteUrl()
    const invitationPath = url.substring(0, url.length - 1) + invitationRoute
    instance.state.set('invitationPath', invitationPath)
    instance.state.set('code', code)
    instance.state.set('loadComplete', true)
  })
})

Template.codeRender.helpers({
  code () {
    return Template.getState('code')
  },
  invitationPath () {
    return Template.getState('invitationPath')
  },
  loadComplete () {
    return Template.getState('loadComplete')
  }
})

Template.codeRender.onRendered(function () {
  const instance = this

  instance.autorun(() => {
    const invitationPath = instance.state.get('invitationPath')
    const loadComplete = instance.state.get('loadComplete')
    if (!invitationPath || !loadComplete) {
      return
    }
    instance.$('.qrcode-canvas').html(null)
    const canvas = instance.$('.qrcode-canvas').get(0)
    QRCode.toCanvas(canvas, invitationPath, { width: '100%' }, function (error) {
      if (error) return API.notify(error)
    })
  })
})
