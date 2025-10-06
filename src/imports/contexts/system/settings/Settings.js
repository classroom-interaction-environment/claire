import { Meteor } from 'meteor/meteor'
import { i18n } from '../../../api/language/language'
import { Themes } from '../../../api/themes/Themes'
import { getCollection } from '../../../api/utils/getCollection'
import { onClientExec, onServer, onServerExec } from '../../../api/utils/archUtils'
import { getFilesCollection } from '../../../api/utils/getFilesCollection'
import { AppImages } from '../../files/image/AppImages'

const reactive = label => () => i18n.get(label)

export const Settings = {
  name: 'settings',
  icon: 'wrench',
  label: 'admin.settings.title',
  legal: {
    imprint: 'imprint',
    privacy: 'privacy',
    terms: 'terms',
    termsStudent: 'termsStudent',
    contact: 'contact',
    research: 'research',
    researchOptions: 'researchOptions'
  },
  schema: {
    ui: {
      type: Object,
      optional: true,
      label: reactive('admin.settings.ui')
    },
    'ui.theme': {
      type: String,
      optional: true,
      label: reactive('admin.settings.ui')
    },
    imprint: {
      type: String,
      optional: true,
      label: () => i18n.get('legal.imprint'),
      autoform: {
        type: 'trix'
      }
    },
    privacy: {
      type: String,
      optional: true,
      label: () => i18n.get('legal.privacy'),
      autoform: {
        type: 'trix'
      }
    },
    terms: {
      type: String,
      optional: true,
      label: () => i18n.get('legal.terms'),
      autoform: {
        type: 'trix'
      }
    },
    termsStudent: {
      type: String,
      optional: true,
      label: () => i18n.get('legal.termsStudent'),
      autoform: {
        type: 'trix'
      }
    },
    contact: {
      type: String,
      optional: true,
      label: () => i18n.get('legal.contact'),
      autoform: {
        type: 'trix'
      }
    },
    research: {
      type: String,
      optional: true,
      label: () => i18n.get('user.research.title'),
      autoform: {
        type: 'trix'
      }
    },
    researchOptions: {
      type: Array,
      optional: true,
      label: () => i18n.get('user.research.options')
    },
    'researchOptions.$': {
      type: String,
      label: () => i18n.get('common.entry')
    },
    mainLogo: {
      type: String,
      optional: true,
      autoform: onClientExec(function () {
        import { FilesTemplates } from '../../files/FilesTemplates'
        import { AppImages } from '../../files/image/AppImages'

        return {
          label: false,
          afFieldInput: {
            type: FilesTemplates.upload.type,
            accept: AppImages.files.accept,
            collection: AppImages.name,
            previewTemplate: AppImages.renderer.template,
            maxSize: AppImages.files.maxSize,
            icon: AppImages.icon,
            capture: AppImages.files.capture
          }
        }
      })
    },
    logos: {
      type: Array,
      optional: true
    },
    'logos.$': {
      type: String,
      autoform: onClientExec(function () {
        import { AppImages } from '../../files/image/AppImages'
        import { Files } from '../../files/Files'

        return {
          type: 'fileUpload',
          collection: AppImages.name,
          accept: AppImages.accept,
          uploadTemplate: Files.templates.upload,
          previewTemplate: AppImages.renderer.template
        }
      })
    }
  },
  fields: {
    default: {
      ui: 1,
      legal: 1
    }
  },
  helpers: {
    defaultSettings () {
      return {
        ui: {
          theme: Themes.caroDefault.value
        }
      }
    }
  },
  publications: {}
}

onClientExec(function () {
  const { ReactiveVar } = require('meteor/reactive-var')
  const settingsDoc = new ReactiveVar(null)

  Settings.helpers.init = function init () {
    Meteor.call(Settings.methods.get.name, {}, (err, res) => {
      if (err) console.error(err)
      if (res) settingsDoc.set(res)
    })
  }

  Settings.helpers.get = function () {
    return settingsDoc.get()
  }

  Settings.helpers.update = function (doc, callback) {
    Meteor.call(Settings.methods.updateSettings.name, doc, (err, res) => {
      if (err) return callback(err)
      if (!res) return callback(new Error('errors.updateFailed'))
      settingsDoc.set(res)
      callback(undefined, res)
    })
  }
})

Settings.methods = {
  get: {
    name: 'settings.methods.get',
    schema: {},
    isPublic: true,
    run: onServer(function () {
      const SettingsCollection = getCollection(Settings.name)
      return SettingsCollection.findOneAsync()
    })
  },
  updateSettings: {
    name: 'settings.methods.updateSettings',
    schema: Settings.schema,
    timeInterval: 1000,
    numRequests: 1,
    run: onServer(async function ({ ui, imprint, privacy, terms, termsStudent, contact, research, researchOptions, mainLogo, logos }) {
      const SettingsCollection = getCollection(Settings.name)
      const settingsDoc = await SettingsCollection.findOneAsync()

      if (!settingsDoc) {
        return SettingsCollection.insertAsync({ ui, imprint, privacy, terms, termsStudent, research, researchOptions, contact, mainLogo, logos })
      }

      const { _id } = settingsDoc
      const modifier = { $set: {} }

      if (ui) modifier.$set.ui = ui
      if (imprint) modifier.$set.imprint = imprint
      if (privacy) modifier.$set.privacy = privacy
      if (terms) modifier.$set.terms = terms
      if (termsStudent) modifier.$set.termsStudent = termsStudent
      if (contact) modifier.$set.contact = contact
      if (research) modifier.$set.research = research
      if (researchOptions) modifier.$set.researchOptions = researchOptions
      if (logos) modifier.$set.logos = logos
      if (mainLogo) modifier.$set.mainLogo = mainLogo

      await SettingsCollection.updateAsync(_id, modifier)
      return SettingsCollection.findOneAsync()
    })
  }
}

Settings.methods.logo = {
  name: 'settings.methods.logo',
  schema: {},
  isPublic: true,
  run: onServerExec(function () {
    import { AppImages } from '../../files/image/AppImages'
    import { getCollection } from '../../../api/utils/getCollection'
    import { getFilesCollection } from '../../../api/utils/getFilesCollection'

    return async function () {
      const SettingsCollection = getCollection(Settings.name)
      const settingsDoc = await SettingsCollection.findOneAsync()
      if (settingsDoc.mainLogo) {
        const appFiles = getFilesCollection(AppImages.name)
        const file = appFiles.findOneAsync(settingsDoc.mainLogo)
        return file && file.link()
      }
    }
  })
}

Settings.methods.updateTheme = {
  name: 'admin.methods.updateTheme',
  admin: true,
  schema: {
    theme: {
      type: String,
      optional: true
    }
  },
  run: onServerExec(function () {
    // TODO import CSS validation lib

    return async function ({ theme }) {
      const SettingsCollection = getCollection(Settings.name)
      const settingsDoc = await SettingsCollection.findOneAsync()
      const modifier = {
        $set: {
          'ui.theme': theme || ''
        }
      }

      return SettingsCollection.updateAsync(settingsDoc._id, modifier)
    }
  })
}
