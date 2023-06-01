import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../api/utils/getCollection'
import { DefaultCurriculumSchema, DefaultCurriculumFields } from './curriculum/defaultSchema'
import { createContextRegistry } from '../../infrastructure/datastructures/createContextRegistry'

const curriculumContexts = new Map()

export const Curriculum = createContextRegistry({
  name: 'Curriculum',
  map: curriculumContexts,
  setIdentity (context) {
    context.isCurriculum = true
  },
  hasIdentity (context) {
    return context.isCurriculum === true
  },

  helpers: {},

  getDefaultSchema (isFilesContext) {
    return DefaultCurriculumSchema(isFilesContext)
  },

  getDefaultPublicFields (isFilesContext) {
    return DefaultCurriculumFields(isFilesContext)
  }
})

Curriculum.load = function ({ name }, query, callback) {
  const context = curriculumContexts.get(name)
  Meteor.call(context.methods.all.name, query, callback)
}

Curriculum.flush = function ({ name }, ids) {
  const Collection = getCollection(name)
  return Collection._collection.remove({ _id: ids })
}
