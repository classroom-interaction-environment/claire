/* global describe it afterEach */
import { Random } from 'meteor/random'
import { TaskWorkingState } from '../../state/TaskWorkingState'
import { LessonStates } from '../../../classroom/lessons/LessonStates'
import { restoreAll } from '../../../../../tests/testutils/stub'
import {
  clearAllCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { checkClass, checkLesson, stubStudentDocs, stubTaskDoc } from '../../../../../tests/testutils/doc/stubDocs'
import { expect } from 'chai'
import { Task } from '../../../curriculum/curriculum/task/Task'
import { LessonErrors } from '../../../classroom/lessons/LessonErrors'
import { Lesson } from '../../../classroom/lessons/Lesson'
import { Users } from '../../../system/accounts/users/User'
import { SchoolClass } from '../../../classroom/schoolclass/SchoolClass'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'

describe(TaskWorkingState.name, function () {
  let TaskWorkingStateCollection

  before(function () {
    [TaskWorkingStateCollection] = mockCollections(TaskWorkingState, Lesson, Users, SchoolClass, Task)
  })

  afterEach(function () {
    restoreAll()
    clearAllCollections()
  })

  after(function () {
    restoreAllCollections()
  })

  describe('methods', function () {
    describe(TaskWorkingState.methods.saveState.name, function () {
      const saveState = TaskWorkingState.methods.saveState.run

      checkLesson(saveState, LessonStates.isRunning, { lessonId: 'lessonId' })
      checkClass(saveState, { isTeacher: false, isStudent: true }, { lessonId: 'lessonId' })

      it('throws if the lesson does not exists', function () {
        const lessonId = Random.id()
        const thrown = expect(() => saveState({ lessonId })).to.throw(DocNotFoundError.name)
        thrown.with.property('reason', 'getDocument.docUndefined')
        thrown.with.deep.property('details', { name: Lesson.name, query: lessonId })
      })
      it('throws if the lesson is not running', function () {
        const { lessonDoc, userId } = stubStudentDocs()
        const lessonId = lessonDoc._id

        expect(() => saveState.call({ userId }, { lessonId })).to.throw(LessonErrors.unexpectedState)
        expect(() => saveState.call({ userId }, { lessonId })).to.throw('expectedRunning')
      })
      it('throws if the task does not exists', function () {
        const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date() })
        const lessonId = lessonDoc._id
        const taskId = Random.id()
        expect(() => saveState.call({ userId }, { lessonId, taskId }))
          .to.throw('getDocument.docUndefined')
          .with.property('details')
          .with.property('query', taskId)
      })
      it('throws if a given groupdoc does not exist by griupd id')
      it('throws if the task is not editable', function () {
        const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date() })
        const taskId = Random.id()
        const taskDoc = { _id: taskId }
        stubTaskDoc(taskDoc)
        const insertDoc = {
          lessonId: lessonDoc._id,
          taskId: taskId
        }

        expect(() => saveState.call({ userId }, insertDoc))
          .to.throw('taskWorkingState.notVisible')
          .with.property('details')
          .with.property('taskId', taskId)
      })
      it('creates a new task progress document if none exists for the given task', function () {
        const taskId = Random.id()
        const taskDoc = { _id: taskId }
        const visibleStudent = [{ _id: taskId, context: Task.name }]
        const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent })
        stubTaskDoc(taskDoc)
        const insertDoc = {
          lessonId: lessonDoc._id,
          taskId: taskId,
          complete: false,
          page: 1,
          progress: 50
        }
        expect(TaskWorkingStateCollection.findOne(insertDoc)).to.equal(undefined)

        const taskWorkingStateId = saveState.call({ userId }, insertDoc)
        expect(TaskWorkingStateCollection.findOne(taskWorkingStateId)).to.be.a('object')

        const expectedDoc = Object.assign({}, insertDoc, { _id: taskWorkingStateId })
        expect(TaskWorkingStateCollection.findOne(taskWorkingStateId)).to.deep.equal(expectedDoc)
      })
      it('updates an existing task progress document if exists for the given task', function () {
        const taskId = Random.id()
        const taskDoc = { _id: taskId }
        const visibleStudent = [{ _id: taskId, context: Task.name }]
        const { lessonDoc, userId } = stubStudentDocs({ startedAt: new Date(), visibleStudent })
        stubTaskDoc(taskDoc)
        const insertDoc = {
          createdBy: userId,
          lessonId: lessonDoc._id,
          taskId: taskId,
          complete: false,
          page: 1,
          progress: 50
        }
        expect(TaskWorkingStateCollection.findOne(insertDoc)).to.equal(undefined)
        const taskWorkingStateId = TaskWorkingStateCollection.insert(insertDoc)

        const updated = saveState.call({ userId }, { lessonId: lessonDoc._id, taskId, complete: true, page: 5, progress: 100 })
        expect(updated).to.equal(1)

        const updatedDoc = TaskWorkingStateCollection.findOne(taskWorkingStateId)
        expect(updatedDoc.complete).to.equal(true)
        expect(updatedDoc.page).to.equal(5)
        expect(updatedDoc.progress).to.equal(100)
      })
    })
  })
})
