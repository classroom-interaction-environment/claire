/* global $ */
import { Template } from 'meteor/templating'
import './head.html'

Template.textRendererh.onRendered(function () {
  const instance = this
  const data = instance.data
  const headDefinition = `<h${data.size}>${data.static}</h${data.size}>`
  instance.$('.textRendererh-root').append($(headDefinition))
})
