import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'
import { Fields } from '../../fields/Fields'
import { Curriculum } from '../../../contexts/curriculum/Curriculum'

export const createCurriculumPublications = function createCurriculumPublications ({ name, publicFields, schema }) {
  const fields = Object.assign({}, Fields.getDefault(), Curriculum.getDefaultPublicFields(), publicFields)
  return {
    curriculum: {
      name: `${name}.publications.curriculum`,
      curriculum: true,
      schema: Object.assign({
        limit: {
          type: Number,
          defaultValue: 50,
          max: 1000,
          optional: true
        }
      }, schema),
      run: onServer(function ({ limit, ...customFields }) {
        const query = Object.assign(customFields, { _master: true })
        const projection = { fields: fields }

        if (limit) projection.limit = limit

        return getCollection(name).find(query, projection)
      }),
      timeInterval: 10000,
      numRequests: 100
    }
  }
}
