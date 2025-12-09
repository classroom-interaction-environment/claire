import { Lesson } from '../Lesson'
import { LessonStates } from '../LessonStates'
import { LessonErrors } from '../LessonErrors'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { getCollection } from '../../../../api/utils/getCollection'
import { getDocsForMember } from '../helpers/getDocsForMember'


export const toggleLessonMaterial = async ({ lessonId, userId, referenceId, context }) => {
  const { lessonDoc } = await getDocsForMember({ lessonId, userId })

  if (!LessonStates.canToggle(lessonDoc)) {
    throw new Meteor.Error(LessonErrors.unexpectedState, 'lesson.expectedToggleAble', { lessonId, startedAt: lessonDoc.startedAt, completedAt: lessonDoc.completedAt })
  }

  // use doc getter to ensure reference doc exists
  await createDocGetter({ name: context })(referenceId)

  const index = (lessonDoc.visibleStudent || []).findIndex(reference => reference._id === referenceId)
  const modifier = {}
  const target = { _id: referenceId, context }

  // if we found no document, we add it to the list
  if (index === -1) {
    modifier.$push = { visibleStudent: target }
  }

  // if we found it we remove it
  else if (index > -1) {
    modifier.$pull = { visibleStudent: target }
  }

  // in case of unexpected state we throw
  else {
    throw new Meteor.Error('common.error', LessonErrors.unexpectedMaterialIndex, { index })
  }

  const updated = await getCollection(Lesson.name).updateAsync({ _id: lessonId }, modifier)
  return !!updated
}
