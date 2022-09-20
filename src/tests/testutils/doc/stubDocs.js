/* global it */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { UserUtils } from '../../../imports/contexts/system/accounts/users/UserUtils'
import { SchoolClass } from '../../../imports/contexts/classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../imports/contexts/classroom/lessons/Lesson'
import { LessonStates } from '../../../imports/contexts/classroom/lessons/LessonStates'
import { Unit } from '../../../imports/contexts/curriculum/curriculum/unit/Unit'
import { Task } from '../../../imports/contexts/curriculum/curriculum/task/Task'
import { mockCollection } from '../mockCollection'
import { stub } from '../stub'
import { expect } from 'chai'

const LessonCollection = mockCollection(Lesson, { noSchema: true })
const UnitCollection = mockCollection(Unit, { noSchema: true })
const SchoolClassCollection = mockCollection(SchoolClass, { noSchema: true })
const TaskCollection = mockCollection(Task, { noSchema: true })

export const stubClassDoc = classDoc => stub(SchoolClassCollection, 'findOne', () => classDoc)
export const stubLessonDoc = lessonDoc => stub(LessonCollection, 'findOne', () => lessonDoc)
export const stubUnitDoc = unitDoc => stub(UnitCollection, 'findOne', () => unitDoc)
export const stubUserDoc = ({ userId }) => stub(Meteor.users, 'findOne', () => ({ _id: userId }))
export const stubTaskDoc = taskDoc => stub(TaskCollection, 'findOne', () => taskDoc)
export const stubAdmin = value => stub(UserUtils, 'isAdmin', () => value)

export const checkLesson = (fct, stateFct, fields = { lessonId: '_id' }) => {
  const userId = Random.id()
  const environment = { userId }
  const lessonIdField = fields.lessonId

  it('throws if the given lesson does not exists', function () {
    const lessonId = Random.id()
    expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw('docNotFound')
    expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw(lessonId)
  })
  if (stateFct) {
    it(`throws if ${stateFct.name} is false`, function () {
      const lessonId = Random.id()
      const classId = Random.id()
      const lessonDoc = { _id: lessonId, classId, createdBy: userId }
      const classDoc = { _id: classId, createdBy: userId, teachers: [userId], students: [userId] }
      stubUserDoc({ userId })
      stubLessonDoc(lessonDoc)
      stubClassDoc(classDoc)
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
    expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw('docNotFound')
    expect(() => fct.call(environment, { [lessonIdField]: lessonId })).to.throw(classId)
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

export const stubTeacherDocs = (lessonMutator) => {
  const userId = Random.id()
  const lessonId = Random.id()
  const classId = Random.id()
  const lessonDoc = Object.assign({}, { _id: lessonId, classId, createdBy: userId }, lessonMutator)
  const classDoc = { _id: classId, createdBy: userId }
  stubUserDoc({ userId })
  stubLessonDoc(lessonDoc)
  stubClassDoc(classDoc)
  stubAdmin(false)
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
