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
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { Group } from '../../../classroom/group/Group'
import { createGroupDoc } from '../../../../../tests/testutils/doc/createGroupDoc'
import { collectPublication } from '../../../../../tests/testutils/collectPublication'

describe(TaskResults.name, function () {
  let LessonCollection
  let TaskCollection
  let TaskResultCollection
  let GroupCollection

  before(function () {
    [LessonCollection, TaskCollection, TaskResultCollection, GroupCollection] = mockCollections(Lesson, [Task, { noSchema: true }], TaskResults, Group)
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

  describe('publications', function () {
    const byGroupPub = TaskResults.publications.byGroup.run

    describe(TaskResults.publications.allByItem.name, function () {
      it('is not implemented')
    })
    describe(TaskResults.publications.byGroup.name, function () {
      it('throws if there is no group doc by group id', function () {
        ;[
          {
            env: {},
            args: {}
          },
          {
            env: {},
            args: { groupId: Random.id() }
          }
        ].forEach(({ env, args }) => {
          const { groupId } = args
          const err = expect(() => byGroupPub.call(env, args))
            .to.throw(DocNotFoundError.name)
          err.with.deep.property('details', { name: Group.name, query: groupId })
        })
      })
      it('throws if user has no permission to access the group', function () {
        const groupId = GroupCollection.insert(createGroupDoc())
        ;[
          {
            env: {},
            args: { groupId }
          },
          {
            env: { userId: Random.id() },
            args: { groupId }
          }
        ].forEach(({ env, args }) => {
          const { userId } = env
          const { groupId } = args
          const err = expect(() => byGroupPub.call(env, args))
            .to.throw(PermissionDeniedError.name)
          err.with.property('reason', 'group.notAMember')
          err.with.deep.property('details', { userId, groupId })
        })
      })
      it('returns all task result docs for that given group and item', function () {
        const userId = Random.id()
        const groupId = GroupCollection.insert(createGroupDoc({ users: [{ userId }] }))
        const itemId = Random.id()
        const createDoc = { lessonId: Random.id(), taskId: Random.id(), itemId, response: [Random.id()], groupId }
        TaskResultCollection.insert({
          lessonId: Random.id(),
          taskId: Random.id(),
          itemId: Random.id(),
          response: [Random.id()],
          groupId: Random.id()
        })
        const taskResultId = TaskResultCollection.insert(createDoc)
        const env = { userId }
        const args = { groupId, itemId }
        const pub = collectPublication(byGroupPub.call(env, args))
        expect(pub.length).to.equal(1)
        expect(pub[0]._id).to.equal(taskResultId)
      })
    })
    describe(TaskResults.publications.byTask.name, function () {
      it('is not implemented')
    })
  })
})
