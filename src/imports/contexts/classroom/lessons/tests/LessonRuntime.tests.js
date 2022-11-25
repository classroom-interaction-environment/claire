/* eslint-env mocha */
import { LessonRuntime } from '../runtime/LessonRuntime'
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

describe(LessonRuntime.name, function () {
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

  before(function () {
    [TaskResultCollection, ImageFilesCollection, AudioFilesColection, DocumentFilesCollection, VideoFilesCollection, TaskWorkingStateCollection, ClusterCollection, BeamerCollection] = mockCollections(
      [TaskResults, noSchema],
      [ImageFiles, forFiles],
      [AudioFiles, forFiles],
      [DocumentFiles, forFiles],
      [VideoFiles, forFiles],
      [TaskWorkingState, noSchema],
      [Cluster, noSchema],
      Beamer,
      Users
    )
  })

  afterEach(function () {
    restoreAll()
    clearAllCollections()
  })

  after(function () {
    restoreAllCollections()
  })

  describe(LessonRuntime.resetBeamer.name, function () {
    it('returns -1, if no beamer doc exists for given query', function () {
      const query = { lessonId: Random.id(), userId: Random.id() }
      expect(LessonRuntime.resetBeamer(query)).to.equal(-1)
    })

    it('returns 0 if there are no references on the beamer doc', function () {
      const query = { lessonId: Random.id(), userId: Random.id() }
      BeamerCollection.insert({ createdBy: query.userId, ui: {}, references: [] })

      expect(LessonRuntime.resetBeamer(query)).to.equal(0)
    })

    it('returns 0 if there are references but not related to the lessonId', function () {
      const query = { lessonId: Random.id(), userId: Random.id() }
      const beamerDocId = BeamerCollection.insert({
        createdBy: query.userId,
        ui: {},
        references: [{ lessonId: Random.id(), referenceId: Random.id(), context: Random.id() }]
      })

      const diff = LessonRuntime.resetBeamer(query)
      expect(diff).to.equal(0)

      const beamerDoc = BeamerCollection.findOne(beamerDocId)
      expect(beamerDoc.references.length).to.equal(1) // expect no removes
    })

    it('returns the diff if there are references related to the lessonId', function () {
      const query = { lessonId: Random.id(), userId: Random.id() }
      const insertDoc = { createdBy: query.userId, ui: {}, references: [] }
      const { lessonRefs, nonLessonRefs } = randomReferences(insertDoc, query.lessonId)

      const refLength = insertDoc.references.length

      // sanity check for random reference builder
      expect(refLength).to.equal(lessonRefs + nonLessonRefs)

      const beamerDocId = BeamerCollection.insert(insertDoc)

      // we expect this method to return the number of refs that have been removed
      const actualDiff = LessonRuntime.resetBeamer(query)
      expect(actualDiff).to.equal(lessonRefs)

      // expect lessonId docs are removed
      const beamerDoc = BeamerCollection.findOne(beamerDocId)
      expect(beamerDoc.references.length).to.equal(nonLessonRefs) // expect no removes

      beamerDoc.references.forEach(({ lessonId }) => {
        expect(lessonId).to.not.equal(query.lessonId)
      })
    })
  })

  describe(LessonRuntime.removeDocuments.name, function () {
    it('removes no documents if there are no docs for a given lesson', function () {
      const removed = LessonRuntime.removeDocuments({ lessonId: Random.id() })
      Object.values(removed).forEach(removedCount => expect(removedCount).to.equal(0))
    })
    it('removed documents, if there are docs for a given lesson', function () {
      const lessonId = Random.id()
      TaskResultCollection.insert({ lessonId })
      TaskWorkingStateCollection.insert({ lessonId })
      ClusterCollection.insert({ lessonId })

      ImageFilesCollection.insert({ meta: { lessonId } })
      AudioFilesColection.insert({ meta: { lessonId } })
      DocumentFilesCollection.insert({ meta: { lessonId } })
      VideoFilesCollection.insert({ meta: { lessonId } })

      stub(ImageFilesCollection.filesCollection, 'remove', (query) => {
        return ImageFilesCollection.remove(query)
      })
      stub(AudioFilesColection.filesCollection, 'remove', (query) => {
        return AudioFilesColection.remove(query)
      })
      stub(DocumentFilesCollection.filesCollection, 'remove', (query) => {
        return DocumentFilesCollection.remove(query)
      })
      stub(VideoFilesCollection.filesCollection, 'remove', (query) => {
        return VideoFilesCollection.remove(query)
      })

      const removed = LessonRuntime.removeDocuments({ lessonId })
      Object.entries(removed).forEach(([context, removedCount]) => {
        const remainCount = getCollection(context).find().count()
        expect(removedCount).to.equal(1)
        expect(remainCount).to.equal(0)
      })
    })
  })
})
