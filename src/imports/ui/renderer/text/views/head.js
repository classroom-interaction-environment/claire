/* global $ */
import { Template } from 'meteor/templating'
import './head.html'

Template.textRendererh.onRendered(function () {
  const data = this.data
  const headDefinition = `<h${data.size}>${data.static}</h${data.size}>`
  this.$('.textRendererh-root').append($(headDefinition))
})
