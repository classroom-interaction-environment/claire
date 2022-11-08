import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Themes } from '../../../../../api/themes/Themes'
import { Settings } from '../../../../../contexts/system/settings/Settings'
import { Schema } from '../../../../../api/schema/Schema'
import { AppImages } from '../../../../../contexts/files/image/AppImages'
import { Form } from '../../../../components/forms/Form'
import { Files } from '../../../../../contexts/files/Files'
import { formIsValid } from '../../../../components/forms/formUtils'
import { getCollection } from '../../../../../api/utils/getCollection'
import { dataTarget } from '../../../../utils/dataTarget'
import { callMethod } from '../../../../controllers/document/callMethod'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import '../../../../generic/nodocs/nodocs'
import './settings.html'

const formInitialized = Form.initialized()
const filesInitialized = Files.initialize(false)
const themesList = Object.values(Themes)
const legalFields = {}
const logosSchema = Schema.create({
  logos: Settings.schema.logos,
  'logos.$': Settings.schema['logos.$']
})

Object.values(Settings.legal).forEach(fieldName => {
  // get the schema for this field and remove optional
  const originalSchemaDef = Settings.schema[fieldName]
  originalSchemaDef.optional = false

  // make this an own schema
  const schemaDef = { [fieldName]: originalSchemaDef }

  // do the same for array fields
  const arrayKey = `${fieldName}.$`
  if (Settings.schema[arrayKey]) {
    schemaDef[arrayKey] = Settings.schema[arrayKey]
  }

  legalFields[fieldName] = {
    name: fieldName,
    label: originalSchemaDef.label,
    schema: Schema.create(schemaDef),
    formName: `${fieldName}Form`
  }
})

const legalFieldsList = Object.values(legalFields)

const API = Template.adminSettings.setDependencies({
  contexts: [Settings, AppImages],
  loaders: [
    async () => {
    // TODO extract into external loader
      import('trix/dist/trix')
      import('trix/dist/trix.css')
    }
  ]
})

Template.adminSettings.onCreated(function onAdminSettingsCreated () {
  const instance = this
  instance.state.set('updating', false)
  instance.state.set('edit', false)
  instance.autorun(() => {
    const settingsDoc = Settings.helpers.get()

    if (settingsDoc) {
      instance.state.set('currentTheme', settingsDoc.ui.theme)
      instance.state.set('customTheme', settingsDoc.ui.theme)
      instance.state.set('settingsDoc', settingsDoc)
    }
    instance.state.set('loadComplete', true)
  })

  instance.autorun(computation => {
    if (!API.initComplete()) { return }

    loadIntoCollection({
      name: AppImages.methods.get,
      collection: getLocalCollection(AppImages.name),
      failure: API.notify,
      success: () => instance.state.set('logoSubReady', true)
    })

    computation.stop()
  })
})

Template.adminSettings.helpers({
  loadComplete () {
    return filesInitialized.get() &&
      formInitialized.get() &&
      Template.getState('loadComplete')
  },
  themes () {
    return themesList
  },
  currentTheme (name) {
    return Template.getState('currentTheme') === name
  },
  customTheme () {
    return Template.getState('customTheme')
  },
  legalFields () {
    return legalFieldsList
  },
  settingsDoc () {
    return Template.getState('settingsDoc')
  },
  isUpdating (fieldName) {
    return Template.getState('updating') === fieldName
  },
  edit (fieldName) {
    return Template.getState('edit') === fieldName
  },
  value (fieldName) {
    const settingsDoc = Template.getState('settingsDoc')
    return settingsDoc && settingsDoc[fieldName]
  },
  logos () {
    const settingsDoc = Template.getState('settingsDoc')
    return settingsDoc && settingsDoc.logos
  },
  logosSchema () {
    return logosSchema
  },
  link (logoId) {
    const logoFile = getCollection(AppImages.name).findOne(logoId)
    return logoFile && logoFile.link()
  }
})

Template.adminSettings.events({
  'change .admin-theme-select' (event, templateInstance) {
    const themeValue = templateInstance.$(event.currentTarget).val()
    const settingsDoc = getCollection(Settings.name).findOne()
    settingsDoc.ui.theme = themeValue
    delete settingsDoc._id
    Meteor.call(Settings.methods.updateSettings.name, settingsDoc, (err) => {
      if (err) {
        API.notify(err)
      }
      else {
        API.notify(true)
      }
    })
  },
  'click .update-custom-theme' (event, templateInstance) {
    event.preventDefault()
    const theme = templateInstance.$('.custom-theme-area').val() || ''

    callMethod({
      name: Settings.methods.updateTheme,
      args: { theme },
      failure: API.notify,
      success: () => {
        API.notify(true)
        setTimeout(() => window.location.reload(), 500)
      }
    })
  },
  'click .edit-field-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    templateInstance.state.set({ edit: target })
  },
  'submit #logosForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid(logosSchema, 'logosForm')
    if (!insertDoc) return

    templateInstance.state.set({ updating: 'logos' })
    Settings.helpers.update(insertDoc, (err, res) => {
      templateInstance.state.set({ updating: null, edit: null })
      if (err) return API.notify(err)
      API.notify(res)
    })
  },
  'submit form' (event, templateInstance) {
    event.preventDefault()
    const formId = event.target.id

    const fieldName = formId.replace('Form', '')
    if (fieldName === 'logos') return

    const fieldContext = legalFields[fieldName]
    const insertDoc = formIsValid(fieldContext.schema, formId)
    if (!insertDoc) return

    templateInstance.state.set({ updating: fieldName })
    Settings.helpers.update(insertDoc, (err, res) => {
      templateInstance.state.set({ updating: null, edit: null })
      if (err) return API.notify(err)
      API.notify(res)
    })
  }
})
