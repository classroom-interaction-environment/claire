import { i18n } from '../../../../api/language/language'
import { firstOption } from '../lib/helpers'
import { licenseOptions } from '../lib/license'

export const EmbeddedResource = {
  name: 'embeddedResource',
  label: 'webResources.embed',
  icon: 'code',
  fieldName: 'embeds',
  isMaterial: true,
  isCurriculum: true,
  isClassroom: true,
  isWebResource: true,
  schema: {
    embedCode: {
      label: i18n.reactive('webResources.embedCode'),
      type: String,
      autoform: {
        type: 'textarea',
        rows: 8,
        class: 'textarea-codefont'
      }
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
    embedCode: 1,
    license: 1,
    licenseOwner: 1
  },
  dependencies: [],
  methods: {},
  publications: {}
}

EmbeddedResource.material = {
  preview: true,
  editable: true,
  schema: {
    embedCode: EmbeddedResource.schema.embedCode,
    license: EmbeddedResource.schema.license,
    licenseOwner: EmbeddedResource.schema.licenseOwner
  },
  renderer: {
    list: {
      template: 'embeddedResourceListRenderer',
      load: async function () {
        return import('./renderer/list/embeddedResourceListRenderer')
      }
    },
    main: {
      template: 'embeddedResourceRenderer',
      load: async function () {
        return import('./renderer/main/embeddedResourceRenderer')
      },
      data: ({ materialDoc, document, options = {} }) => {
        const { print = false, preview = true, student = false, editable = true } = options
        const { name } = materialDoc
        return Object.assign({}, document, {
          meta: name,
          preview: preview,
          print: print,
          student: student
        })
      },
      /**
       * @deprecated
       */
      previewData(targetId) {
        console.warn(this.name, 'previewData is deprecated!')
        if (!targetId) return
        const { collection } = this
        const embed = collection.findOne(targetId)
        if (!embed) return
        embed.meta = EmbeddedResource.name
        return embed
      }
    }
  },
  async load () {
    // WebResource.renderer
    return import('../renderer/webResourceRenderer')
  }
}
