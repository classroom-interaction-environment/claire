import { Random } from 'meteor/random'
import { restoreAll, stub } from '../../../../../tests/testutils/stub'
import { clearCollections, mockCollections, restoreAllCollections } from '../../../../../tests/testutils/mockCollection'
import { Users } from '../../../system/accounts/users/User'
import { Lesson } from '../Lesson'
import { LessonHelpers } from '../LessonHelpers'
import { Unit } from '../../../curriculum/curriculum/unit/Unit'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { Phase } from '../../../curriculum/curriculum/phase/Phase'
import { Task } from '../../../curriculum/curriculum/task/Task'
import { expect } from 'chai'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { stubClassDoc } from '../../../../../tests/testutils/doc/stubDocs'

describe('LessonHelpers', function () {
  let LessonCollection
  let SchoolClassCollection

  beforeEach(function () {
    [LessonCollection, SchoolClassCollection] = mockCollections(Lesson, SchoolClass, Unit, Phase, Task, Users)
  })

  afterEach(function () {
    restoreAll()
    clearCollections(Users, Lesson, Unit, SchoolClass, Phase, Task)
  })

  after(function () {
    restoreAllCollections()
  })

  describe(LessonHelpers.getClassDocIfStudent.name, function () {
    const { getClassDocIfStudent } = LessonHelpers

    it('throws if user does not exists', function () {
      const userId = Random.id()
      const classId = Random.id()
      const classDoc = { _id: classId, students: [Random.id()], createdBy: Random.id() }
      stubClassDoc(classDoc)
      expect(() => getClassDocIfStudent({ userId, classId }))
        .to.throw('schoolClass.notMember')
        .with.property('details')
        .with.property('userId', userId)
    })
    it('throws if class does not exists', function () {
      const userId = Random.id()
      const classId = Random.id()
      expect(() => getClassDocIfStudent({ userId, classId }))
        .to.throw('getDocument.docUndefined')
        .with.property('details')
        .with.property('query', classId)
    })
    it('throws is user is not student', function () {
      const userId = Random.id()
      const classId = Random.id()
      stubClassDoc({ _id: classId, students: [] })
      expect(() => getClassDocIfStudent({ userId, classId })).to.throw(SchoolClass.errors.notMember)
    })
    it('returns the doc otherwise', function () {
      const userId = Random.id()
      const classId = Random.id()
      const classDoc = { _id: classId, students: [userId] }
      stubClassDoc(classDoc)
      const actualClassDoc = getClassDocIfStudent({ userId, classId })
      expect(actualClassDoc).to.deep.equal(classDoc)
    })
  })
  describe(LessonHelpers.isMemberOfLesson.name, function () {
    const { isMemberOfLesson } = LessonHelpers

    it('throws if user does not exists', function () {
      const userId = Random.id()
      expect(() => isMemberOfLesson({ userId })).to.throw(DocNotFoundError.name, 'user.notFound')
    })
    it('throws if lesson does not exists', function () {
      const userId = Random.id()
      const lessonId = Random.id()
      expect(() => isMemberOfLesson({ userId, lessonId }))
        .to.throw('getDocument.docUndefined')
        .with.property('details')
        .with.property('query', lessonId)
    })
    it('throws class doc does not exists', function () {
      const userId = Random.id()
      const lessonId = Random.id()
      const classId = Random.id()
      stub(LessonCollection, 'findOne', () => ({ _id: lessonId, classId }))
      stub(SchoolClassCollection, 'findOne', () => undefined)
      expect(() => isMemberOfLesson({ userId, lessonId }))
        .to.throw('getDocument.docUndefined')
        .with.property('details')
        .with.property('query', classId)
    })
    it('returns true if the given user is student of the lesson / class', function () {
      const userId = Random.id()
      const lessonId = Random.id()
      const classId = Random.id()
      const classDoc = { _id: classId, students: [userId] }
      stub(LessonCollection, 'findOne', () => ({ _id: lessonId, classId }))
      stub(SchoolClassCollection, 'findOne', () => classDoc)
      expect(isMemberOfLesson({ userId, lessonId })).to.equal(true)
    })
    it('returns true if the given user is teacher of the lesson / class', function () {
      const userId = Random.id()
      const lessonId = Random.id()
      const classId = Random.id()
      const classDoc = { _id: classId, teachers: [userId] }
      stub(LessonCollection, 'findOne', () => ({ _id: lessonId, classId }))
      stub(SchoolClassCollection, 'findOne', () => classDoc)
      expect(isMemberOfLesson({ userId, lessonId })).to.equal(true)
    })
    it('returns true if the given user is owner of the class', function () {
      const userId = Random.id()
      const lessonId = Random.id()
      const classId = Random.id()
      const classDoc = { _id: classId, createdBy: userId }
      stub(LessonCollection, 'findOne', () => ({ _id: lessonId, classId }))
      stub(SchoolClassCollection, 'findOne', () => classDoc)
      expect(isMemberOfLesson({ userId, lessonId })).to.equal(true)
    })
    it('returns false if the given user is not member of the lesson', function () {
      const userId = Random.id()
      const lessonId = Random.id()
      const classdoc = { _id: Random.id() }
      stub(LessonCollection, 'findOne', () => ({ _id: lessonId }))
      stub(SchoolClassCollection, 'findOne', () => classdoc)
      expect(isMemberOfLesson({ userId, lessonId })).to.equal(false)
    })
  })
  describe(LessonHelpers.isTeacher.name, function () {
    const { isTeacher } = LessonHelpers
    it('throws if there is no lessonDoc', function () {
      const defDoc = { userId: Random.id(), lessonId: Random.id() }
      expect(() => isTeacher(defDoc)).to.throw(DocNotFoundError.name, defDoc.lessonId, Lesson.name)
    })
    it('throws if there is no linked classDoc', function () {
      const userId = Random.id()
      const classId = Random.id()
      const unit = Random.id()
      const lessonDocId = LessonCollection.insert({ createdBy: Random.id(), classId, unit })
      const defDoc = { userId, lessonId: lessonDocId }
      expect(() => isTeacher(defDoc)).to.throw(DocNotFoundError.name, classId, SchoolClass.name)
    })
    it('returns true if the user creator of the lesson', function () {
      const userId = Random.id()
      const unit = Random.id()
      const lessonId = LessonCollection.insert({ createdBy: userId, classId: Random.id(), unit })
      const defDoc = { userId, lessonId }
      expect(isTeacher(defDoc)).to.equal(true)
    })
    it('returns true if the user is in teachers of the class', function () {
      const userId = Random.id()
      const unit = Random.id()
      const classId = SchoolClassCollection.insert({ createdBy: Random.id(), title: Random.id(), teachers: [userId] })
      const lessonId = LessonCollection.insert({ createdBy: Random.id(), classId, unit })
      const defDoc = { userId, lessonId }
      expect(isTeacher(defDoc)).to.equal(true)
    })
    it('returns true if the user is creator of the class', function () {
      const userId = Random.id()
      const unit = Random.id()
      const classId = SchoolClassCollection.insert({ createdBy: userId, title: Random.id(), teachers: [Random.id()] })
      const lessonId = LessonCollection.insert({ createdBy: Random.id(), classId, unit })
      const defDoc = { userId, lessonId }
      expect(isTeacher(defDoc)).to.equal(true)
    })
    it('returns false otherwise', function () {
      const userId = Random.id()
      const unit = Random.id()
      const classId = SchoolClassCollection.insert({
        createdBy: Random.id(),
        title: Random.id(),
        teachers: [Random.id()]
      })
      const lessonId = LessonCollection.insert({ createdBy: Random.id(), classId, unit })
      const defDoc = { userId, lessonId }
      expect(isTeacher(defDoc)).to.equal(false)
    })
  })
})
