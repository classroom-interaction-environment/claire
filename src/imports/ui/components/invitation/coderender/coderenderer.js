import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Routes } from '../../../../api/routes/Routes'
import { createInvitationURLQuery } from '../../../../contexts/classroom/invitations/url/createInvitationURLQuery'
import QRCode from 'qrcode'
import './coderender.html'

const API = Template.codeRender.setDependencies()

Template.codeRender.onCreated(function () {

  this.autorun(() => {
    this.state.set('loadComplete', false)
    const data = Template.currentData()
    const { code } = data
    if (!code) return

    const codeUrlQuery = createInvitationURLQuery({ code })
    const invitationRoute = Routes.codeRegister.path(codeUrlQuery)
    const url = Meteor.absoluteUrl()
    const invitationPath = url.substring(0, url.length - 1) + invitationRoute
    this.state.set('invitationPath', invitationPath)
    this.state.set('code', code)
    this.state.set('loadComplete', true)
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

  this.autorun(() => {
    const invitationPath = this.state.get('invitationPath')
    const loadComplete = this.state.get('loadComplete')
    if (!invitationPath || !loadComplete) {
      return
    }
    this.$('.qrcode-canvas').html(null)
    const canvas = this.$('.qrcode-canvas').get(0)
    QRCode.toCanvas(canvas, invitationPath, { width: '100%' }, (error) => {
      if (error) return API.notify(error)
    })
  })
})
