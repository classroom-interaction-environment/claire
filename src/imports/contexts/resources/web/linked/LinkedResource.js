import { i18n } from '../../../../api/language/language'
import { firstOption } from '../lib/helpers'
import { licenseOptions } from '../lib/license'

export const LinkedResource = {
  name: 'linkedResource',
  label: 'webResources.link',
  icon: 'link',
  isCurriculum: true,
  isClassroom: true,
  isWebResource: true,
  fieldName: 'links',
  schema: {
    url: {
      type: String,
      label: i18n.reactive('common.url')
    },
    license: {
      type: String,
      optional: true,
      label: i18n.reactive('license.title'),
      defaultValue: 'copyright',
      autoform: {
        firstOption,
        options () {
          return licenseOptions
        }
      }
    },
    licenseOwner: {
      type: String,
      label: i18n.reactive('license.owner'),
      optional: true
    }
  },
  publicFields: {
    url: 1,
    license: 1,
    licenseOwner: 1
  },
  dependencies: [],
  methods: {},
  publications: {},
  isMaterial: true
}

LinkedResource.material = {
  preview: true,
  editable: true,
  schema: {
    url: LinkedResource.schema.url,
    license: LinkedResource.schema.license,
    licenseOwner: LinkedResource.schema.licenseOwner
  },
  renderer: {
    list: {
      template: 'linkedResourceListRenderer',
      load: async function () {
        return import('./renderer/list/linkedResourceListRenderer')
      }
    },
    main: {
      template: 'linkedResourceRenderer',
      load: async function () {
        return import('./renderer/main/linkedResourceRenderer')
      },
      /**
       * @deprecated
       */
      previewData (targetId) {
        console.warn(this.name, 'previewData is deprecated!')
        if (!targetId) return
        const { collection } = this
        const linkDoc = collection.findOne(targetId)
        if (!linkDoc) return
        linkDoc.meta = LinkedResource.name
        return linkDoc
      },
      data: ({ materialDoc, document, options = {} }) => {
        const { print = false, preview = true, student = false } = options
        const { name } = materialDoc
        return Object.assign({}, document, {
          meta: name,
          preview: preview,
          print: print,
          student: student
        })
      }
    }
  }
}
