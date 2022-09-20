import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { Fields } from '../../fields/Fields'
import { Curriculum } from '../../../contexts/curriculum/Curriculum'
import { isFilesContext } from '../../../contexts/files/isFilesContext'
import { curriculumQuery } from '../methods/curriculumQuery'
import { userIsAdmin } from '../../accounts/admin/userIsAdmin'
import { createLog } from '../../log/createLog'

export const createEditorPublication = function createEditorPublication (context) {
  const { name, publicFields, schema } = context
  const debug = createLog({ name, type: 'debug' })
  const fields = Object.assign(Fields.getDefault(), Curriculum.getDefaultPublicFields(), publicFields)
  const isFilesCollection = isFilesContext(context)
  return {
    /**
     * @deprecated
     */
    editor: {
      name: `${name}.publications.editor`,
      schema: Object.assign({
        limit: {
          type: Number,
          max: 1000,
          optional: true
        },
        curriculum: {
          type: Boolean,
          optional: true
        },
        meta: {
          type: Object,
          optional: true
        },
        'meta.taskId': {
          type: String,
          optional: true
        },
        ids: {
          type: Array,
          optional: true
        },
        'ids.$': String
      }, schema),
      roles: UserUtils.roles.teacher,
      run: onServer(function ({ limit, curriculum, meta, ids, ...customFields }) {
        const { userId } = this

        // we want to include by the following conditions
        // - non-cloned createdBy me
        const createdByQuery = { ...customFields }

        if (!userIsAdmin(userId)) {
          if (isFilesCollection) {
            createdByQuery.userId = userId
          }

          else {
            createdByQuery.createdBy = userId
          }
        }

        if (ids?.length) {
          createdByQuery._id = { $in: ids }
        }

        // - master docs with optional limitation to a subset of docs (defined in query)
        const masterQuery = curriculumQuery(customFields)

        if (ids?.length) {
          masterQuery._id = { $in: ids }
        }

        const query = {
          $or: [
            masterQuery,
            createdByQuery
          ]
        }

        const projection = { fields: fields }

        if (limit) {
          projection.limit = limit
        }

        const cursor = getCollection(name).find(query, projection)
        debug(name, JSON.stringify(query), '=>', cursor.count())

        return cursor
      }),
      timeInterval: 10000,
      numRequests: 100
    }
  }
}
