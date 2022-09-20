import { ContextBuilder } from '../../../infrastructure/datastructures/ContextBuilder'
import { System } from '../../../contexts/system/System'
import { Files } from '../../../contexts/files/Files'
import { Material } from '../../../contexts/material/Material'
import { Curriculum } from '../../../contexts/curriculum/Curriculum'
import { Classroom } from '../../../contexts/classroom/Classroom'
import { systemPipeline } from '../../../contexts/system/systemPipeline'
import { filesPipeline } from '../../../contexts/files/filesPipeline'
import { materialPipeline } from '../../../contexts/material/materialPipeline'
import { curriculumPipeline } from '../../../contexts/curriculum/curriculumPipeline'
import { classroomPipeline } from '../../../contexts/classroom/classroomPipeline'
import { buildPipeline } from '../../../infrastructure/pipelines/client/buildPipeline'
import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'

ContextBuilder
  .addRegistry(System, { pipelines: [systemPipeline] })
  .addRegistry(Files, { pipelines: [filesPipeline] })
  .addRegistry(Material, { pipelines: [materialPipeline] })
  .addRegistry(Curriculum, { pipelines: [curriculumPipeline] })
  .addRegistry(Classroom, { pipelines: [classroomPipeline] })



export const initContext = (context, buildFct) => {
  if (!ContextRegistry.has(context.name)) {
    ContextBuilder.build(context, function () {
      (buildFct || buildPipeline).call(null, context, {
        collection: true,
        filesCollection: true
      })
    })
    ContextRegistry.add(context)
  }
}
