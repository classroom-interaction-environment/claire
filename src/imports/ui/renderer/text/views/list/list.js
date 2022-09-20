import { Template } from 'meteor/templating'
import './list.css'
import './list.html'

Template.textRendererlist.onCreated(function () {
  const instance = this
  instance.autorun(() => {
    Template.currentData()
    instance.state.set('loadComplete', false)
    setTimeout(() => instance.state.set('loadComplete', true), 300)
  })
})

Template.textRendererlist.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  }
})
