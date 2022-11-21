import { check } from 'meteor/check'
import { TaskResults } from '../../../tasks/results/TaskResults'
import { TaskWorkingState } from '../../../tasks/state/TaskWorkingState'

import { createRemoveDoc } from '../../../../api/utils/documentUtils'

import { ImageFiles } from '../../../files/image/ImageFiles'
import { AudioFiles } from '../../../files/audio/AudioFiles'
import { DocumentFiles } from '../../../files/document/DocumentFiles'
import { VideoFiles } from '../../../files/video/VideoFiles'

const removeImageFiles = createRemoveDoc(ImageFiles, { checkOwner: false, multiple: true })
const removeAudioFiles = createRemoveDoc(AudioFiles, { checkOwner: false, multiple: true })
const removeDocumentFiles = createRemoveDoc(DocumentFiles, { checkOwner: false, multiple: true })
const removeVideoFiles = createRemoveDoc(VideoFiles, { checkOwner: false, multiple: true })

const removeTaskResults = createRemoveDoc(TaskResults, { checkOwner: false, multiple: true })
const removeTaskWorkingState = createRemoveDoc(TaskWorkingState, { checkOwner: false, multiple: true })

/**
 * Removes all runtime documents (docs created during a lesson by teacher and students) by a given lesson.
 * Does not check for permissions so use with care only within methods!
 * Does not check, whether lesson exists, because this is not relevant for the queries here.
 * @param lessonId
 * @return returns an Object with context names as keys and number of removed docs as values
 */

export const removeDocuments = function ({ lessonId } = {}) {
  check(lessonId, String)
  const docQuery = { lessonId }
  const fileQuery = { 'meta.lessonId': lessonId }

  // the context <-> count map
  const removed = {}

  // tasks
  removed[TaskResults.name] = removeTaskResults(docQuery)
  removed[TaskWorkingState.name] = removeTaskWorkingState(docQuery)

  // response processor products
  // TODO load all and remove

  // files
  removed[ImageFiles.name] = removeImageFiles(fileQuery)
  removed[AudioFiles.name] = removeAudioFiles(fileQuery)
  removed[DocumentFiles.name] = removeDocumentFiles(fileQuery)
  removed[VideoFiles.name] = removeVideoFiles(fileQuery)

  return removed
}
