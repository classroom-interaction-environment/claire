import { createPipeline } from '../../infrastructure/pipelines/createPipeline'
import { Classroom } from './Classroom'
import { createMyMethod } from '../../api/decorators/methods/createMyMethod'
import { createMyPublication } from '../../api/decorators/publications/createMyPublication'

export const classroomPipeline = createPipeline(Classroom.name, function (context) {
  Classroom.setIdentity(context)

  const classRoomMethods = {}
  classRoomMethods.my = createMyMethod(context)
  context.methods = Object.assign({}, classRoomMethods, context.methods)

  const classRoomPublications = {}
  classRoomPublications.my = createMyPublication({
    name: context.name,
    publicFields: context.publicFields,
    isFilesCollection: context.isFilesCollection
  })

  context.publications = Object.assign({}, classRoomPublications, context.publications)

  Classroom.add(context)
})
