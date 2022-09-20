import { Template } from 'meteor/templating'
import { loadTemplate } from '../../../infrastructure/templates/loadTemplate'
import { createLog } from '../../../api/log/createLog'
import './TemplateLoader.html'

const warn = createLog({
  name: 'Template.TemplateLoader',
  type: 'warn',
  devOnly: false
})

/**
 * TemplateLoader is a generic utility Template that expects a data Object to
 * load the described Template. It keeps track of loaded Templates, allowing
 * to skip expensive import operations.
 *
 * Once the Template has been loaded (or is already loaded) it will be
 * rendered inside a {Template.dynamic} block. Until then a loading indicator
 * is displayed.
 *
 * @template TemplateLoader
 * @param template  {String} the name of the Template to load
 * @param load {Function} async function to load the Template
 */

Template.TemplateLoader.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    if (!data) return

    const { template, load } = data
    if (!template || !load) {
      warn('skip undefined template')
      warn(data)
      return
    }

    const loaded = loadTemplate({ template, load })

    // TODO use template as dict key
    instance.state.set('loadComplete', loaded.get())
  })
})

Template.TemplateLoader.helpers({
  loadComplete () {
    return Template.instance().state.get('loadComplete')
  }
})
