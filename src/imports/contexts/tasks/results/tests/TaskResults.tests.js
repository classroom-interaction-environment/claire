/* global describe it afterEach */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { TaskResults } from '../TaskResults'
import { Lesson } from '../../../classroom/lessons/Lesson'
import { SchoolClass } from '../../../classroom/schoolclass/SchoolClass'
import {
  clearAllCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { LessonStates } from '../../../classroom/lessons/LessonStates'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { restoreAll, stub } from '../../../../../tests/testutils/stub'
import { expect } from 'chai'
import { Task } from '../../../curriculum/curriculum/task/Task'
import { LessonErrors } from '../../../classroom/lessons/LessonErrors'
import { LessonHelpers } from '../../../classroom/lessons/LessonHelpers'

describe(TaskResults.name, function () {
  let LessonCollection
  let TaskCollection
  let TaskResultCollection

  before(function () {
    [LessonCollection, TaskCollection, TaskResultCollection] = mockCollections(Lesson, [Task, { noSchema: true }], TaskResults)
  })

  afterEach(function () {
    restoreAll()
    clearAllCollections()
  })

  after(function () {
    restoreAllCollections()
  })

  describe('methods', function () {
    describe(TaskResults.methods.saveTask.name, function () {
      const save = TaskResults.methods.saveTask.run

      it('throws if the lesson does not exists', function () {
        const userId = Random.id()
        const createDoc = { lessonId: Random.id() }
        stub(Meteor.users, 'findOne', () => ({ _id: userId }))

        const thrown = expect(() => save.call({ userId }, createDoc))
          .to.throw(DocNotFoundError.name)
        thrown.with.property('reason', 'getDocument.docUndefined')
        thrown.with.deep.property('details', {
          name: Lesson.name,
          query: createDoc.lessonId
        })
      })
      it('throws if the lesson is not running', function () {
        const taskId = Random.id()
        const createDoc = { lessonId: Random.id(), taskId, itemId: Random.id(), response: [Random.id()] }
        stub(LessonHelpers, 'isMemberOfLesson', () => true)
        stub(LessonCollection, 'findOne', () => ({ _id: createDoc.lessonId, visibleStudent: [taskId] }))
        stub(TaskCollection, 'findOne', () => ({ _id: createDoc.taskId }))
        stub(LessonStates, 'isRunning', () => false)

        expect(() => save(createDoc)).to.throw('errors.permissionDenied', LessonErrors.unexpectedState)
      })
      it('throws if the task is not editable', function () {
        const createDoc = { lessonId: Random.id(), taskId: Random.id(), itemId: Random.id(), response: [Random.id()] }
        stub(LessonHelpers, 'isMemberOfLesson', () => true)
        stub(LessonCollection, 'findOne', () => ({ _id: createDoc.lessonId }))
        stub(TaskCollection, 'findOne', () => ({ _id: createDoc.taskId }))
        stub(LessonStates, 'isRunning', () => false)

        expect(() => save(createDoc)).to.throw('errors.permissionDenied', TaskResults.errors.notEditable)
      })
      it('throws if the task does not exists', function () {
        const createDoc = { taskId: Random.id() }
        stub(LessonHelpers, 'isMemberOfLesson', () => true)
        expect(() => save(createDoc)).to.throw(DocNotFoundError.name, createDoc.taskId)
      })
      it('throws if not member of the lesson', function () {
        stub(LessonHelpers, 'isMemberOfLesson', () => false)
        expect(() => save({})).to.throw('errors.permissionDenied', SchoolClass.errors.notMember)
      })
      it('creates a new response document if none exists for the given item', function () {
        const createDoc = { lessonId: Random.id(), taskId: Random.id(), itemId: Random.id(), response: [Random.id()] }
        stub(LessonHelpers, 'isMemberOfLesson', () => true)
        stub(LessonHelpers, 'taskIsEditable', () => true)
        stub(TaskCollection, 'findOne', () => ({ _id: createDoc.taskId }))
        stub(LessonCollection, 'findOne', () => ({ _id: createDoc.lessonId }))
        stub(LessonStates, 'isRunning', () => true)

        expect(TaskResultCollection.find().count()).to.equal(0)

        const docId = save(createDoc)
        expect(docId).to.be.a('string')
        expect(TaskResultCollection.find().count()).to.equal(1)

        const resultDoc = TaskResultCollection.findOne(docId)
        delete resultDoc._id

        expect(resultDoc).to.deep.equal(createDoc)
      })
      it('updates the response document if one exists already for the given item', function () {
        const createDoc = { lessonId: Random.id(), taskId: Random.id(), itemId: Random.id(), response: [Random.id()] }
        stub(LessonHelpers, 'isMemberOfLesson', () => true)
        stub(TaskCollection, 'findOne', () => ({ _id: createDoc.taskId }))
        stub(LessonCollection, 'findOne', () => ({ _id: createDoc.lessonId }))
        stub(LessonStates, 'isRunning', () => true)
        stub(LessonHelpers, 'taskIsEditable', () => true)

        const docId = TaskResultCollection.insert(createDoc)
        const updateDoc = Object.assign({}, createDoc, { response: [Random.id()] })

        const updated = save(updateDoc)
        expect(updated).to.equal(1)

        const resultDoc = TaskResultCollection.findOne(docId)
        expect(resultDoc.lessonId).to.equal(createDoc.lessonId)
        expect(resultDoc.taskId).to.equal(createDoc.taskId)
        expect(resultDoc.itemId).to.equal(createDoc.itemId)
        expect(resultDoc.response).to.not.deep.equal(createDoc.response)
        expect(resultDoc.response).to.deep.equal(updateDoc.response)
      })
    })
  })
})
