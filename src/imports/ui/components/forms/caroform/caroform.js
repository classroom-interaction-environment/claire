import { Template } from 'meteor/templating'
import { Form } from '../Form'
import './caroform.html'

Template.caroForm.setDependencies({})

const forminitialized = Form.initialized()

Template.caroForm.onRendered(function () {
  const instance = this
  console.debug(instance.data)
  const schema = instance.data.schema._schema

  const autofocus = Object.keys(schema).find(key => {
    const entry = schema[key]
    return (entry.autoform && entry.autoform.autofocus)
  })

  if (autofocus) {
    const target = document.querySelector(`input[name=${autofocus}]`)
    if (target) {
      target.focus()
    }
  }

})

Template.caroForm.helpers({
  loadComplete () {
    return forminitialized.get()
  },
  mandatoryFields (names, schema) {
    return names.filter(entry => schema._schema[ entry.name ].optional !== true)
  },
  optionalFields (names, schema) {
    return names.filter(entry => schema._schema[ entry.name ].optional === true)
  },
  preventCollapse (collapse) {
    return collapse === false
  },
  classNames () {
    const { data } = Template.instance()
    const customClass = data.class || ''
    return `${customClass}`
  },
  fieldSetAtts () {
    const { data } = Template.instance()
    const blocked = data.blocked
    const atts = {}
    if (blocked) atts.disabled = ''
    return atts
  },
  inputIsDisabled () {
    const { data } = Template.instance()
    return data.blocked ? 'disabled' : undefined
  },
  getValidation (v) {
    return v || 'none'
  }
})

Template.caroForm.events({
  'submit form' (event, templateInstance) {
    templateInstance.$('.collapse').collapse('show')
  }
})
