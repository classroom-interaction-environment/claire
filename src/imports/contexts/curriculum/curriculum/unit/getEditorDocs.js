import { getCollection } from '../../../../api/utils/getCollection'

export const getEditorDocs = function () {
  import { Pocket } from '../pocket/Pocket'
  import { Lesson } from '../../../classroom/lessons/Lesson'
  import { SchoolClass } from '../../../classroom/schoolclass/SchoolClass'
  import { Unit } from './Unit'

  const UnitCollection = getCollection(Unit.name)
  const PocketCollection = getCollection(Pocket.name)
  const SchoolClassCollection = getCollection(SchoolClass.name)
  const LessonCollection = getCollection(Lesson.name)

  return function ({ unitId }) {
    const { checkDoc, checkOwner, userId } = this
    const unitDoc = UnitCollection.findOne(unitId)
    checkDoc(unitDoc)
    checkOwner(unitDoc)

    const lessonDoc = LessonCollection.findOne({ unit: unitId, createdBy: userId })
    const originalUnitDoc = UnitCollection.findOne({ _id: lessonDoc?.unitOriginal })
    const pocketDoc = PocketCollection.findOne({ _id: unitDoc.pocket })
    const classDoc = SchoolClassCollection.findOne({ _id: lessonDoc?.classId })
    return {
      lessonDoc,
      originalUnitDoc,
      pocketDoc,
      classDoc
    }
  }
}