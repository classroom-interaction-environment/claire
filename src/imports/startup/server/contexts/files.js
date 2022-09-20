import { ImageFiles } from '../../../contexts/files/image/ImageFiles'
import { AppImages } from '../../../contexts/files/image/AppImages'
import { ProfileImages } from '../../../contexts/files/image/ProfileImages'
import { AudioFiles } from '../../../contexts/files/audio/AudioFiles'
import { DocumentFiles } from '../../../contexts/files/document/DocumentFiles'
import { VideoFiles } from '../../../contexts/files/video/VideoFiles'

import { Files } from '../../../contexts/files/Files'
import { Curriculum } from '../../../contexts/curriculum/Curriculum'
import { Classroom } from '../../../contexts/classroom/Classroom'
import { Material } from '../../../contexts/material/Material'
import { ContextBuilder } from '../../../infrastructure/datastructures/ContextBuilder'
import { filesPipeline } from '../../../contexts/files/filesPipeline'

Files.info('register builtin files')

ContextBuilder.addRegistry(Files, {
  pipelines: [filesPipeline]
})

// These file contexts occur in various places, such as
// - as material in a task
// - as core material in the curriculum
// - as response to an item (upload)
// - in a response-processor
// Therefore, the files will run through several pipelines, making them
// a very complex structure afterwards.

;[
  ImageFiles,
  AudioFiles,
  DocumentFiles,
  VideoFiles
].forEach(fileContext => {
  Files.add(fileContext)
  Material.add(fileContext)
  Curriculum.add(fileContext)
  Classroom.add(fileContext)
  ContextBuilder.addContext(fileContext)
})

// AppImages and ProfileImages are separate contexts, they are simply
// supported on the application level, creating a richer experience but are not
// necessary in oder to execute run the CLAIRE
;[
  AppImages,
  ProfileImages,
].forEach(fileContext => {
  Files.add(fileContext)
  ContextBuilder.addContext(fileContext)
})
