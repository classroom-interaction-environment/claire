/* global it */
import { Random } from 'meteor/random'
import { UserUtils } from '../../../imports/contexts/system/accounts/users/UserUtils'
import { SchoolClass } from '../../../imports/contexts/classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../imports/contexts/classroom/lessons/Lesson'
import { LessonStates } from '../../../imports/contexts/classroom/lessons/LessonStates'
import { Unit } from '../../../imports/contexts/curriculum/curriculum/unit/Unit'
import { Task } from '../../../imports/contexts/curriculum/curriculum/task/Task'
import { stub } from '../stub'
import { expect } from 'chai'
import { getCollection } from '../../../imports/api/utils/getCollection'
import { Users } from '../../../imports/contexts/system/accounts/users/User'
import { DocNotFoundError } from '../../../imports/api/errors/types/DocNotFoundError'
import { getUsersCollection } from '../../../imports/api/utils/getUsersCollection'

export const stubClassDoc = classDoc => stub(getCollection(SchoolClass.name), 'findOne', () => classDoc)
export const stubLessonDoc = lessonDoc => stub(getCollection(Lesson.name), 'findOne', () => lessonDoc)
export const stubUnitDoc = unitDoc => stub(getCollection(Unit.name), 'findOne', () => unitDoc)
export const stubUserDoc = ({ userId }) => stub(getCollection(Users.name), 'findOne', () => ({ _id: userId }))
export const stubTaskDoc = taskDoc => stub(getCollection(Task.name), 'findOne', () => taskDoc)
export const stubAdmin = value => stub(UserUtils, 'isAdmin', () => value)

export const checkLesson = (fct, stateFct, fields = { lessonId: '_id' }) => {
  const userId = Random.id()
  const environment = { userId }
  const lessonIdField = fields.lessonId

  it('throws if the given lesson does not exists', function () {
    const lessonId = Random.id()
    const expectLesson = expect(() => fct.call(environment, { [lessonIdField]: lessonId }))
      .to.throw(DocNotFoundError.name)
    expectLesson.with.property('reason', 'getDocument.docUndefined')
    expectLesson
      .with.property('details')
      .with.property('query', lessonId)
  })
  if (stateFct) {
    it(`throws if ${stateFct.name} is false`, function () {
      const classId = getCollection(SchoolClass.name).insert({
        title: Random.id(),
        createdBy: userId,
        teachers: [userId],
        students: [userId]
      })
      const lessonId = getCollection(Lesson.name).insert({ classId, createdBy: userId, unit: Random.id() })
      getUsersCollection().insert({ _id: userId, username: Random.id() })
      stubAdmin(false)
      stub(LessonStates, stateFct.name, () => false)
      expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw('unexpectedState')
    })
  }
}

export const checkClass = (fct, { isTeacher = true, isStudent = false } = {}, fields = { lessonId: '_id' }) => {
  const userId = Random.id()
  const environment = { userId }
  const lessonIdField = fields.lessonId

  it('throws if the given class does not exists', function () {
    const lessonId = Random.id()
    const classId = Random.id()
    const lessonDoc = { _id: lessonId, classId }
    stubLessonDoc(lessonDoc)
    stubUserDoc(environment)
    const expectError = expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw(DocNotFoundError.name)
    expectError.with.property('reason', 'getDocument.docUndefined')
    expectError
      .with.property('details')
      .with.property('query', classId)
  })

  if (isTeacher) {
    it('throws if the user is not teacher of the class', function () {
      const lessonId = Random.id()
      const classId = Random.id()
      const lessonDoc = { _id: lessonId, classId }
      const classDoc = { _id: classId }
      stubLessonDoc(lessonDoc)
      stubUserDoc(environment)
      stubClassDoc(classDoc)
      stubAdmin(false)
      expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw('permissionDenied')
      expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw(SchoolClass.errors.notTeacher)
    })
  }

  if (isStudent) {
    it('throws if the user is not student of the class', function () {
      const lessonId = Random.id()
      const classId = Random.id()
      const lessonDoc = { _id: lessonId, classId }
      const classDoc = { _id: classId }
      stubLessonDoc(lessonDoc)
      stubUserDoc(environment)
      stubClassDoc(classDoc)
      stubAdmin(false)
      expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw('permissionDenied')
      expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw(SchoolClass.errors.notMember)
    })
  }
}

export const stubTeacherDocs = (lessonMutator = {}, {
  classId = Random.id(),
  userId = Random.id(),
  lessonId = Random.id(),
  isAdmin = false,
  classTitle = Random.id(5),
  unit = Random.id()
} = {}) => {
  const lessonDoc = Object.assign({}, { _id: lessonId, classId, createdBy: userId, unit }, lessonMutator)
  const classDoc = { _id: classId, createdBy: userId, title: classTitle }
  stubUserDoc({ userId })
  stubLessonDoc(lessonDoc)
  stubClassDoc(classDoc)
  stubAdmin(isAdmin)
  return { userId, lessonDoc, classDoc }
}

export const stubStudentDocs = (lessonMutators) => {
  const userId = Random.id()
  const lessonId = Random.id()
  const classId = Random.id()
  const lessonDoc = Object.assign({}, { _id: lessonId, classId, createdBy: Random.id() }, lessonMutators)
  const classDoc = { _id: classId, createdBy: Random.id(), students: [userId] }

  stubUserDoc({ userId })
  stubLessonDoc(lessonDoc)
  stubClassDoc(classDoc)
  stubAdmin(false)

  return { userId, lessonDoc, classDoc }
}
