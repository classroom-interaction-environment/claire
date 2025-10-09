import { getCollection } from '../../../../api/utils/getCollection'
import { $in } from '../../../../api/utils/query/inSelector'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { Meteor } from 'meteor/meteor'
import { Unit } from '../../../curriculum/curriculum/unit/Unit'
import { Lesson } from '../Lesson'
import { isMember } from '../../schoolclass/helpers/isMember'

/**
 * Gets all associated units by a given set of lessons (via lesson ids)
 * @param lessonIds
 * @return {*}
 */
export const unitsByLesson = async ({ lessonIds, userId }) => {
  const classIds = new Set()
  const unitsIds = new Set()
  const lessonDocs = await getCollection(Lesson.name).find({ _id: $in(lessonIds) }).fetchAsync()

  lessonDocs.forEach(doc => {
    classIds.add(doc.classId)
  })

  const classDocs = await getCollection(SchoolClass.name).find({ _id: $in(classIds) }).fetchAsync()
  for (const lessonDoc of lessonDocs) {
    const { classId } = lessonDoc
    const classDoc = classDocs.find(({ _id }) => _id === classId)

    if (!classDoc) {
      throw new Meteor.Error('errors.permissionDenied', SchoolClass.errors.notMember, { userId })
    }

    if (!isMember(userId, classDoc)) {
      throw new Meteor.Error('errors.permissionDenied', SchoolClass.errors.notMember, { userId })
    }
  }

  lessonDocs.forEach(doc => {
    unitsIds.add(doc.unit)
  })

  return getCollection(Unit.name).find({ _id: $in(unitsIds) }).fetchAsync()
}