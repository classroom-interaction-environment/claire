import { Template } from 'meteor/templating'
import lozad from 'lozad'

// TODO load these dynamically
import './views/p.html'
import './views/richtext'
import './views/plain.html'
import './views/quote.html'
import './views/list/list'
import './views/enum'
import './views/head'
import './views/item'
import './textRenderer.html'

export const textRenderer = 'textRenderer'

Template.textRenderer.onCreated(function () {
  // TODO laod sub views dynamically
})

Template.textRenderer.onRendered(function () {
  const el = document.querySelectorAll('.lozad')
  const observer = lozad(el, {
    root: document.querySelector('.task-page-container'),
    rootMargin: '10px 0px', // syntax similar to that of CSS Margin
    threshold: 1.0, // ratio of element convergence
    load: function (el) {
      const $el = global.$(el)
      $el.prop('src', $el.data('src'))
    }
  })
  observer.observe()
})

Template.textRenderer.helpers({
  templateName (meta) {
    return `${textRenderer}${meta}`
  }
})
