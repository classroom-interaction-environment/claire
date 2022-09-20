import { Template } from 'meteor/templating'
import { TemplateLoader } from 'meteor/jkuester:template-loader'
import { initTemplateDependencies } from '../../../ui/blaze/initTemplateDependencies'
import '../../../ui/generic/loading/loading'
import '../../../ui/components/onloaded/onLoaded'

/*******************************************************************************
 * By loading this template the client creates a prototype function for the
 * Template class, which allows to decouple infrastructural tasks from the
 * respective Template files.
 *
 * These tasks consist of
 * - creating context, collection, assign methods-def, publications-def
 *
 ******************************************************************************/

// MAYBE move into own file?
TemplateLoader.enable()
  .register('docnotfound', async () => import('../../../ui/generic/docnotfound/docnotfound'))
  .register('disconnected', async () => import('../../../ui/generic/disconnected/disconnected'))
  .register('actionButton', async () => import('../../../ui/generic/actionbutton/actionbutton'))
  .register('routeButton', async () => import('../../../ui/generic/routebutton/routebutton'))
  .register('link', async () => import('../../../ui/generic/link/link'))
  .register('modal', async () => import('../../../ui/generic/modal/modal'))
  .register('icon', async () => import('../../../ui/generic/icon/icon'))
  .register('tooltip', async () => import('../../../ui/generic/tooltip/tooltip'))
  .register('nodocs', async () => import('../../../ui/generic/nodocs/nodocs'))
  .register('info', async () => import('../../../ui/generic/info/info'))
  .register('short', async () => import('../../../ui/generic/short/short'))
  .register('fail', async () => import('../../../ui/generic/fail/fail'))


Template.prototype.setDependencies = function (options = {}) {
  const template = this
  const { viewName } = template

  if (completeStates.has(viewName)) {
    throw new Error('Template setDependencies called multiple times. This should never occur.')
  }

  const api = initTemplateDependencies.call(template, options)
  completeStates.set(viewName, api.initComplete)
  return api
}

const completeStates = new Map()

// to ease-up init-checks (so Templates won't need to declare helpers for that
// all the time) we add this global helper, which we can use in templates
// together with: {{#onLoaded loaded=templateLoaded}}...{{/onLoaded}}
Template.registerHelper('templateLoaded', function () {
  const instance = Template.instance()
  const templateName = instance.view.name.split('.')[1]
  const template = Template[templateName]
  return !template.initComplete || template.initComplete.get()
})
