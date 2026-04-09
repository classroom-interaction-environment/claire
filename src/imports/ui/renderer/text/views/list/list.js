import { Template } from 'meteor/templating'
import './list.css'
import './list.html'

Template.textRendererlist.onCreated(function () {
  this.autorun(() => {
    Template.currentData()
    this.state.set('loadComplete', false)
    setTimeout(() => this.state.set('loadComplete', true), 300)
  })
})

Template.textRendererlist.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  }
})
