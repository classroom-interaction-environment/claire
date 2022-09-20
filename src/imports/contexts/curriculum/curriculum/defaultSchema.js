import { i18n } from '../../../api/language/language'
import { RevisionTypes } from './types/RevisionType'
import { CurriculumHelpers } from './CurriculumHelpers'
import { Schema } from '../../../api/schema/Schema'
import { firstOption } from '../../tasks/definitions/common/helpers'

export const DefaultCurriculumSchema = (isFilesContext) => ({
  status: {
    type: Schema.provider.Integer,
    label: i18n.reactive('common.status'),
    resolve (value) {
      return CurriculumHelpers.getStatusIcon(value)
    },
    optional: true,
    min: 0,
    max: Object.values(RevisionTypes.entries).length - 1,
    displayType: 'icon',
    autoform: {
      type: 'hidden',
      defaultValue: 0,
      afFieldInput: {
        firstOption: firstOption,
        options () { return Object.values(RevisionTypes.entries) }
      }
    }
  },
  [isFilesContext ? 'name' : 'title']: {
    type: String,
    label: i18n.reactive('common.title'),
    min: 1,
    max: 1500,
    displayType: 'string',
    optional: false
  },
  description: {
    type: String,
    optional: true,
    max: 5000,
    label: i18n.reactive('common.description'),
    autoform: {
      afFieldInput: {
        type: 'textarea',
        rows: 3,
        class: 'description'
      }
    }
  }
})

export const DefaultCurriculumFields = () => {
  const defaultFields = {}
  Object.keys(DefaultCurriculumSchema()).forEach(key => {
    defaultFields[key] = 1
  })

  return defaultFields
}
