import { i18n } from '../../../../api/language/language'
import { firstOption } from '../lib/helpers'
import { licenseOptions } from '../lib/license'

export const Literature = {
  name: 'literature',
  label: 'literature.title',
  icon: 'book',
  fieldName: 'literature',
  isMaterial: true,
  isCurriculum: true,
  isClassroom: true,
  isWebResource: true,
  schema: {
    title: {
      type: String,
      label: i18n.reactive('common.title')
    },
    subtitle: {
      type: String,
      optional: true,
      label: i18n.reactive('literature.subTitle')
    },
    authors: {
      type: String,
      label: i18n.reactive('literature.authors')
    },
    year: {
      type: Number,
      label: i18n.reactive('literature.year')
    },
    issue: {
      type: String,
      label: i18n.reactive('literature.issue'),
      optional: true
    },
    volume: {
      type: String,
      label: i18n.reactive('literature.volume'),
      optional: true
    },
    publisher: {
      type: String,
      label: i18n.reactive('literature.publisher'),
      optional: true
    },
    city: {
      type: String,
      label: i18n.reactive('literature.city'),
      optional: true
    },
    url: {
      type: String,
      label: i18n.reactive('literature.url'),
      optional: true,
      autoform: {
        type: 'url'
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
    }
  },
  publicFields: {
    authors: 1,
    year: 1,
    issue: 1,
    volume: 1,
    publisher: 1,
    url: 1,
    license: 1
  },
  methods: {},
  dependencies: [],
  publications: {}
}

Literature.material = {
  preview: true,
  editable: true,
  renderer: {
    list: {
      template: 'literatureListRenderer',
      load: async function () {
        return import('./renderer/list/literatureListRenderer')
      }
    },
    main: {
      template: 'literatureRenderer',
      load: async function () {
        return import('./renderer/main/literatureRenderer')
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
      },
      previewData (targetId) {
        console.warn(this.name, 'previewData is deprecated!')
        return targetId && this.collection.findOne(targetId)
      }
    }
  },
  schema: Literature.schema
}
