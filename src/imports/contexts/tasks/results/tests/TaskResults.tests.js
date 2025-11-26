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
import { expectThrow } from '../../../../../tests/testutils/expectThrow'
import { count } from '../../../../utils/count'
import { Admin } from '../../../system/accounts/admin/Admin'

describe(TaskResults.name, () => {
  let LessonCollection
  let TaskCollection
  let TaskResultCollection
  let GroupCollection
  let SchoolClassCollection

  before(() => {
    [LessonCollection, TaskCollection, TaskResultCollection, GroupCollection, SchoolClassCollection] = mockCollections(Lesson, [Task, { noSchema: true }], TaskResults, Group, SchoolClass, Admin)
  })

  afterEach(async () => {
    restoreAll()
    await clearAllCollections()
  })

  after(async () => {
    await restoreAllCollections()
  })

  describe('methods', () => {
    describe(TaskResults.methods.saveTask.name, () => {
      const save = TaskResults.methods.saveTask.run

      const stubDocuments = async ({
                                     isMember,
                                     hasLesson,
                                     hasClass,
                                     hasTask,
                                     isRunning,
                                     taskEditable,
                                     response = []
                                   } = {}) => {
        const classId = Random.id()
        const lessonId = Random.id()
        const taskId = Random.id()
        const userId = Random.id()
        const itemId = Random.id()
        const createDoc = { lessonId, taskId, itemId, response }
        stub(Meteor.users, 'findOneAsync', async () => ({ _id: userId }))
        stub(TaskCollection, 'findOneAsync', async () => (hasTask && { _id: createDoc.taskId }))
        stub(SchoolClassCollection, 'findOneAsync', async () => (hasClass && {
          _id: classId,
          students: isMember ? [userId] : []
        }))
        stub(LessonCollection, 'findOneAsync', async () => (hasLesson && {
          _id: createDoc.lessonId,
          classId,
          visibleStudent: taskEditable ? [{ _id: createDoc.taskId }] : []
        }))
        stub(LessonStates, 'isRunning', () => isRunning)

        return {
          createDoc,
          userId,
          classId,
          lessonId,
          taskId,
          itemId
        }
      }

      it('throws if the lesson does not exists', async () => {
        const { createDoc, lessonId, userId } = await stubDocuments({ hasLesson: false })
        await expectThrow({
          fn: () => save.call({ userId }, createDoc),
          error: DocNotFoundError.name,
          reason: 'getDocument.docUndefined',
          details: {
            name: Lesson.name,
            query: lessonId
          }
        })
      })
      it('throws if the lesson is not running', async () => {
        const { userId, createDoc } = await stubDocuments({
          hasLesson: true,
          hasClass: true,
          hasTask: true,
          isMember: true,
          isRunning: false,
          taskEditable: true
        })

        await expectThrow({
          fn: () => save.call({ userId }, createDoc),
          error: PermissionDeniedError.name,
          reason: LessonErrors.unexpectedState
        })
      })
      it('throws if the task is not editable', async () => {
        const { userId, createDoc } = await stubDocuments({
          hasLesson: true,
          hasClass: true,
          hasTask: true,
          isMember: true,
          isRunning: true,
          taskEditable: false
        })

        await expectThrow({
          fn: () => save.call({ userId }, createDoc),
          error: PermissionDeniedError.name,
          reason: TaskResults.errors.notEditable
        })
      })
      it('throws if the task does not exists', async () => {
        const { userId, createDoc, taskId } = await stubDocuments({
          hasLesson: true,
          hasClass: true,
          hasTask: false,
          isMember: true,
          isRunning: true,
          taskEditable: false
        })
        await expectThrow({
          fn: () => save.call({ userId }, createDoc),
          error: DocNotFoundError.name,
          details: { name: Task.name, query: taskId }
        })
      })
      it('throws if not member of the lesson', async () => {
        const { userId, createDoc } = await stubDocuments({
          hasLesson: true,
          hasClass: true,
          hasTask: true,
          isMember: false,
          isRunning: true,
          taskEditable: true
        })
        await expectThrow({
          fn: () => save.call({ userId }, createDoc),
          error: PermissionDeniedError.name,
          reason: SchoolClass.errors.notMember
        })
      })
      it('creates a new response document if none exists for the given item', async () => {
        const { userId, createDoc } = await stubDocuments({
          hasLesson: true,
          hasClass: true,
          hasTask: true,
          isMember: true,
          isRunning: true,
          taskEditable: true
        })

        expect(await count(TaskResultCollection)).to.equal(0)

        const docId = await save.call({ userId }, createDoc)
        expect(docId).to.be.a('string')
        expect(await count(TaskResultCollection)).to.equal(1)

        const resultDoc = await TaskResultCollection.findOne(docId)
        delete resultDoc._id

        expect(resultDoc).to.deep.equal(createDoc)
      })
      it('updates the response document if one exists already for the given item', async () => {
        const response = [Random.id()]
        const { userId, createDoc } = await stubDocuments({
          hasLesson: true,
          hasClass: true,
          hasTask: true,
          isMember: true,
          isRunning: true,
          taskEditable: true,
          response
        })

        const docId = await TaskResultCollection.insertAsync({ createdBy: userId, ...createDoc })
        expect(await count(TaskResultCollection)).to.equal(1)
        const updateDoc = Object.assign({}, createDoc, { response: [Random.id()] })

        const updated = await save.call({ userId }, updateDoc)
        expect(updated).to.equal(1)

        const resultDoc = await TaskResultCollection.findOneAsync(docId)
        expect(resultDoc.lessonId).to.equal(createDoc.lessonId)
        expect(resultDoc.taskId).to.equal(createDoc.taskId)
        expect(resultDoc.itemId).to.equal(createDoc.itemId)
        expect(resultDoc.response).to.not.deep.equal(createDoc.response)
        expect(resultDoc.response).to.deep.equal(updateDoc.response)
      })
    })
  })

  describe('publications', () => {
    const byGroupPub = TaskResults.publications.byGroup.run

    describe(TaskResults.publications.allByItem.name, () => {
      it('is not implemented')
    })
    describe(TaskResults.publications.byGroup.name, () => {
      it('throws if there is no group doc by group id', async () => {
        const input = [
          {
            env: {},
            args: {}
          },
          {
            env: {},
            args: { groupId: Random.id() }
          }
        ]
        for (const { env, args } of input) {
          const { groupId } = args
          await expectThrow({
            fn: () => byGroupPub.call(env, args),
            error: DocNotFoundError.name,
            details: { name: Group.name, query: groupId }
          })
        }
      })
      it('throws if user has no permission to access the group', async () => {
        const groupId = await GroupCollection.insertAsync(createGroupDoc())
        const input = [
          {
            env: {},
            args: { groupId }
          },
          {
            env: { userId: Random.id() },
            args: { groupId }
          }
        ]
        for (const { env, args } of input) {
          const { userId } = env
          const { groupId } = args
          await expectThrow({
            fn: () => byGroupPub.call(env, args),
            error: PermissionDeniedError.name,
            reason: 'group.notAMember',
            details: { userId, groupId }
          })
        }
      })
      it('returns all task result docs for that given group and item', async () => {
        const userId = Random.id()
        const groupId = await GroupCollection.insertAsync(createGroupDoc({ users: [{ userId }] }))
        const itemId = Random.id()
        const createDoc = { lessonId: Random.id(), taskId: Random.id(), itemId, response: [Random.id()], groupId }
        await TaskResultCollection.insertAsync({
          lessonId: Random.id(),
          taskId: Random.id(),
          itemId: Random.id(),
          response: [Random.id()],
          groupId: Random.id()
        })
        const taskResultId = await TaskResultCollection.insertAsync(createDoc)
        const env = { userId }
        const args = { groupId, itemId }
        const pub = await collectPublication(await byGroupPub.call(env, args))
        expect(pub.length).to.equal(1)
        expect(pub[0]._id).to.equal(taskResultId)
      })
    })
    describe(TaskResults.publications.byTask.name, () => {
      it('is not implemented')
    })
  })
})
