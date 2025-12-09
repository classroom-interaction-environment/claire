/* eslint-env mocha */
import { Beamer } from '../../../beamer/Beamer'
import { TaskResults } from '../../../tasks/results/TaskResults'
import { Random } from 'meteor/random'
import {
  clearAllCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { expect } from 'chai'
import { TaskWorkingState } from '../../../tasks/state/TaskWorkingState'
import { Cluster } from '../../../tasks/responseProcessors/aggregate/cluster/Cluster'
import { getCollection } from '../../../../api/utils/getCollection'
import { ImageFiles } from '../../../files/image/ImageFiles'
import { AudioFiles } from '../../../files/audio/AudioFiles'
import { DocumentFiles } from '../../../files/document/DocumentFiles'
import { Users } from '../../../system/accounts/users/User'
import { VideoFiles } from '../../../files/video/VideoFiles'
import { stub, restoreAll } from '../../../../../tests/testutils/stub'
import { Group } from '../../group/Group'
import { createGroupDoc } from '../../../../../tests/testutils/doc/createGroupDoc'
import { resetBeamer } from '../runtime/resetBeamer'
import { removeDocuments } from '../runtime/removeDocuments'
import { resetGroups } from '../runtime/resetGroups'
import { expectThrow } from '../../../../../tests/testutils/expectThrow'

const randomReferences = (beamerDoc, lessonId) => {
  const rand = Math.floor(Math.random() * 53)
  let lessonRefs = 0
  let nonLessonRefs = 0
  for (let i = 0; i < rand; i++) {
    let refLessonId

    if (Math.random() > 0.53) {
      refLessonId = lessonId
      lessonRefs++
    }
    else {
      refLessonId = Random.id()
      nonLessonRefs++
    }

    beamerDoc.references.push({
      lessonId: refLessonId,
      referenceId: Random.id(),
      context: Random.id()
    })
  }

  return { lessonRefs, nonLessonRefs }
}

describe('lesson runtime helpers', () => {
  // remove runtimedocs related

  // TODO 1.0
  // TODO we should have a function that we can call and
  // TODO that returns all the context names for those context
  // TODO that are related to the lesson runtime
  // TODO why?
  // TODO because in the furutre we want to have packages to be
  // TODO added, that can augment lessons with custom items
  // TODO and therefore custom artifacts, so they need to be
  // TODO registered somewhere and retrievable somehow
  const noSchema = { noSchema: true }
  const forFiles = { noSchema: true, isFilesCollection: true }
  let TaskResultCollection
  let ImageFilesCollection
  let AudioFilesColection
  let DocumentFilesCollection
  let VideoFilesCollection
  let TaskWorkingStateCollection
  let ClusterCollection
  let BeamerCollection
  let GroupCollection

  before(() => {
    [TaskResultCollection, ImageFilesCollection, AudioFilesColection, DocumentFilesCollection, VideoFilesCollection, TaskWorkingStateCollection, ClusterCollection, BeamerCollection, , GroupCollection] = mockCollections(
      [TaskResults, noSchema],
      [ImageFiles, forFiles],
      [AudioFiles, forFiles],
      [DocumentFiles, forFiles],
      [VideoFiles, forFiles],
      [TaskWorkingState, noSchema],
      [Cluster, noSchema],
      Beamer,
      Users,
      Group
    )
  })

  afterEach(async () => {
    restoreAll()
    await clearAllCollections()
  })

  after(async () => {
    await restoreAllCollections()
  })

  describe(resetBeamer.name,  () => {
    it('returns -1, if no beamer doc exists for given query', async () => {
      const query = { lessonId: Random.id(), userId: Random.id() }
      expect(await resetBeamer(query)).to.equal(-1)
    })

    it('returns 0 if there are no references on the beamer doc', async () => {
      const query = { lessonId: Random.id(), userId: Random.id() }
      await BeamerCollection.insertAsync({ createdBy: query.userId, ui: {}, references: [] })

      expect(await resetBeamer(query)).to.equal(0)
    })

    it('returns 0 if there are references but not related to the lessonId', async () => {
      const query = { lessonId: Random.id(), userId: Random.id() }
      const beamerDocId = BeamerCollection.insert({
        createdBy: query.userId,
        ui: {},
        references: [{ lessonId: Random.id(), referenceId: Random.id(), context: Random.id() }]
      })

      const diff = await resetBeamer(query)
      expect(diff).to.equal(0)

      const beamerDoc = await BeamerCollection.findOneAsync(beamerDocId)
      expect(beamerDoc.references.length).to.equal(1) // expect no removes
    })

    it('returns the diff if there are references related to the lessonId', async () => {
      const query = { lessonId: Random.id(), userId: Random.id() }
      const insertDoc = { createdBy: query.userId, ui: {}, references: [] }
      const { lessonRefs, nonLessonRefs } = randomReferences(insertDoc, query.lessonId)

      const refLength = insertDoc.references.length

      // sanity check for random reference builder
      expect(refLength).to.equal(lessonRefs + nonLessonRefs)

      const beamerDocId = await BeamerCollection.insertAsync(insertDoc)

      // we expect this method to return the number of refs that have been removed
      const actualDiff = await resetBeamer(query)
      expect(actualDiff).to.equal(lessonRefs)

      // expect lessonId docs are removed
      const beamerDoc = await BeamerCollection.findOneAsync (beamerDocId)
      expect(beamerDoc.references.length).to.equal(nonLessonRefs) // expect no removes

      beamerDoc.references.forEach(({ lessonId }) => {
        expect(lessonId).to.not.equal(query.lessonId)
      })
    })
  })

  describe(removeDocuments.name, () => {
    it('removes no documents if there are no docs for a given lesson', async () => {
      const removed = await removeDocuments({ lessonId: Random.id() })
      Object.values(removed).forEach(removedCount => expect(removedCount).to.equal(0))
    })
    it('removed documents, if there are docs for a given lesson', async () => {
      const lessonId = Random.id()
      await TaskResultCollection.insertAsync({ lessonId })
      expect(await TaskResultCollection.countDocuments({})).to.equal(1)
      await TaskWorkingStateCollection.insertAsync({ lessonId })
      expect(await TaskWorkingStateCollection.countDocuments({})).to.equal(1)
      await ClusterCollection.insertAsync({ lessonId })
      expect(await ClusterCollection.countDocuments({})).to.equal(1)
      await ImageFilesCollection.insertAsync({ meta: { lessonId } })
      expect(await ImageFilesCollection.countDocuments({})).to.equal(1)
      await AudioFilesColection.insertAsync({ meta: { lessonId } })
      expect(await AudioFilesColection.countDocuments({})).to.equal(1)
      await DocumentFilesCollection.insertAsync({ meta: { lessonId } })
      expect(await DocumentFilesCollection.countDocuments({})).to.equal(1)
      await VideoFilesCollection.insertAsync({ meta: { lessonId } })
      expect(await VideoFilesCollection.countDocuments({})).to.equal(1)


      const removed = await removeDocuments({ lessonId })
      for (const [context, removedCount] of Object.entries(removed)) {
        const remainCount = await getCollection(context).countDocuments({})
        expect(remainCount, context).to.equal(0)
        expect(removedCount, context).to.equal(1)
      }
    })
  })

  describe(resetGroups.name, () => {
    it('throws on incomplete args', async () => {
      await expectThrow({
        fn: () => resetGroups({}),
        message: 'Match error: Missing key \'unitId\''
      })
    })
    it('removes all ad-hoc groups', async () => {
      const unitId = Random.id()
      const removeGroupId = await GroupCollection.insertAsync(createGroupDoc({ unitId, title: 'to remove', isAdhoc: true }))
      const otherGroupId = GroupCollection.insert(createGroupDoc({ unitId, title: 'other', isAdhoc: false }))
      expect(await GroupCollection.countDocuments({})).to.equal(2)
      const result = await resetGroups({ unitId })
      expect(result).to.deep.equal({ removed: 1, updated: 1 })
      expect(await GroupCollection.countDocuments({ _id: removeGroupId })).to.equal(0)
      expect(await GroupCollection.countDocuments({ _id: otherGroupId })).to.equal(1)
      expect(await GroupCollection.countDocuments({})).to.equal(1)
    })
    it('resets groups that are defined on a unit-level', async () => {
      const lessonId = Random.id()
      const unitId = Random.id()
      const updateGroupId = await GroupCollection.insertAsync(createGroupDoc({
        title: 'to update',
        unitId,
        visible: [{ _id: Random.id(), context: 'foo' }],
        isAdhoc: false
      }))
      const groupDoc = await GroupCollection.findOneAsync(updateGroupId)
      const otherGroupId = await GroupCollection.insertAsync(createGroupDoc({
        title: 'other',
        unitId: Random.id(),
        isAdhoc: false
      }))
      const otherDoc = await GroupCollection.findOneAsync(otherGroupId)

      expect(await GroupCollection.countDocuments({})).to.equal(2)
      const result = await resetGroups({ lessonId, unitId })
      expect(result).to.deep.equal({ removed: 0, updated: 1 })
      expect(await GroupCollection.findOneAsync(updateGroupId)).to.deep.equal({
        _id: updateGroupId,
        visible: [],
        title: groupDoc.title,
        isAdhoc: false,
        unitId,
        createdBy: groupDoc.createdBy,
        users: groupDoc.users,
        maxUsers: groupDoc.maxUsers
      })
      expect(await GroupCollection.countDocuments({})).to.equal(2)
      expect(await GroupCollection.findOneAsync(otherGroupId)).to.deep.equal(otherDoc)
    })
  })
})
