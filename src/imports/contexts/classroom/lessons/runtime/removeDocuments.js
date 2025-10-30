import { check } from 'meteor/check'
import { TaskResults } from '../../../tasks/results/TaskResults'
import { TaskWorkingState } from '../../../tasks/state/TaskWorkingState'
import { ImageFiles } from '../../../files/image/ImageFiles'
import { AudioFiles } from '../../../files/audio/AudioFiles'
import { DocumentFiles } from '../../../files/document/DocumentFiles'
import { VideoFiles } from '../../../files/video/VideoFiles'
import { createDocRemover } from '../../../../api/utils/document/createDocRemover'

const options = { checkOwner: false, multiple: true }
const removeTaskResults = createDocRemover({ name: TaskResults.name, ...options })
const removeTaskWorkingState = createDocRemover({ name: TaskWorkingState.name, ...options })
const removeImageFiles = createDocRemover({
  name: ImageFiles.name,
  isFilesCollection: ImageFiles.isFilesCollection,
  ...options
})
const removeAudioFiles = createDocRemover({
  name: AudioFiles.name,
  isFilesCollection: AudioFiles.isFilesCollection,
  ...options
})
const removeDocumentFiles = createDocRemover({
  name: DocumentFiles.name,
  isFilesCollection: DocumentFiles.isFilesCollection,
  ...options
})
const removeVideoFiles = createDocRemover({
  name: VideoFiles.name,
  isFilesCollection: VideoFiles.isFilesCollection,
  ...options
})

/**
 * Removes all runtime documents (docs created during a lesson by teacher and students) by a given lesson.
 * Does not check for permissions so use with care only within methods!
 * Does not check, whether lesson exists, because this is not relevant for the queries here.
 * @async
 * @param lessonId {string} the lesson _id
 * @param userId {string} the user _id performing the removal
 * @return {object} returns an Object with context names as keys and number of removed docs as values
 */

export const removeDocuments = async ({ lessonId, userId } = {}) => {
  check(lessonId, String)
  const docQuery = { lessonId }
  const fileQuery = { 'meta.lessonId': lessonId }
  // the context <-> count map
  const removed = {}

  // tasks
  removed[TaskResults.name] = await removeTaskResults({ query: docQuery, userId })
  removed[TaskWorkingState.name] = await removeTaskWorkingState({ query: docQuery, userId })

  // response processor products
  // TODO load all and remove

  // files
  removed[ImageFiles.name] = await removeImageFiles({ query: fileQuery, userId })
  removed[AudioFiles.name] = await removeAudioFiles({ query: fileQuery, userId })
  removed[DocumentFiles.name] = await removeDocumentFiles({ query: fileQuery, userId })
  removed[VideoFiles.name] = await removeVideoFiles({ query: fileQuery, userId })

  return removed
}
