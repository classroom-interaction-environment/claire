import { Template } from 'meteor/templating'
import { Blaze } from 'meteor/blaze'
import { Tracker } from 'meteor/tracker'

/**
 * Test-Utitlity to ease-up Blaze Template rendering tests
 */
export const UITests = {}

const withDiv = function withDiv (callback) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  try {
    callback(el)
  }
  finally {
    document.body.removeChild(el)
  }
}

/**
 * Renders a template with given data (async) and resolves to the rendered
 * DOM-element.
 * @async
 * @param template {string|Template}
 * @param data {any}
 * @return {Promise<{}>}
 */
UITests.withRenderedTemplate = function withRenderedTemplate (template, data) {
  return new Promise(resolve => {
    withDiv(el => {
      const ourTemplate = typeof template === 'string'
        ? Template[template]
        : template
      Blaze.renderWithData(ourTemplate, data, el)
      Tracker.flush()
      resolve(el)
    })
  })
}

/**
 * Registers a template for rendering
 */
UITests.preRender = () => Template.registerHelper('_', key => key)

/**
 * Unregisters a Template from rendering
 */
UITests.postRender = () => Template.deregisterHelper('_')

/**
 * Async timeout in ms
 * @param ms
 * @return {Promise<any>}
 */
UITests.wait = ms => new Promise(resolve => setTimeout(() => resolve(), ms))
