/* global atob */
import { Template } from 'meteor/templating'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { callMethod } from '../../../controllers/document/callMethod'
import '../../../generic/fail/fail'
import './confirmResearch.html'

Template.confirmResearch.onCreated(function () {
  const instance = this
  try {
    const confirmDataBase64 = instance.data.params.data
    const decodedConformData = atob(confirmDataBase64)
    const decodedURIParams = decodeURIComponent(decodedConformData)
    const params = new URLSearchParams(decodedURIParams)
    const { email, token } = Object.fromEntries(params.entries())
    callMethod({
      name: Users.methods.confirmResearch,
      args: { email, token },
      receive: () => instance.state.set('loadComplete', true),
      failure: error => instance.state.set({ error }),
      success: () => instance.state.set('successful', true)
    })
  }
  catch (e) {
    return instance.state.set({
      error: e,
      loadComplete: true
    })
  }
})

Template.confirmResearch.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  },
  error () {
    return Template.getState('error')
  },
  successful () {
    return Template.getState('successful')
  }
})
