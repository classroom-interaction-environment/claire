import { Task } from '../../../contexts/curriculum/curriculum/task/Task'
import { Phase } from '../../../contexts/curriculum/curriculum/phase/Phase'
import { LinkedResource } from '../../../contexts/resources/web/linked/LinkedResource'
import { EmbeddedResource } from '../../../contexts/resources/web/embedded/EmbeddedResource'
import { Literature } from '../../../contexts/resources/web/literature/Literature'
import { Material } from '../../../contexts/material/Material'
import { materialPipeline } from '../../../contexts/material/materialPipeline'
import { ContextBuilder } from '../../../infrastructure/datastructures/ContextBuilder'
import { Curriculum } from '../../../contexts/curriculum/Curriculum'
import { Classroom } from '../../../contexts/classroom/Classroom'
import { ContextPlugins } from '../../../api/plugins/PluginRegistry'

Material.info('register default material')

ContextBuilder.addRegistry(Material, {
  pipelines: [materialPipeline]
})

const plugins = ContextPlugins.all({ isMaterial: true }).map(fn => fn())

plugins.concat([
  Task,
  LinkedResource,
  EmbeddedResource,
  Literature,
  Phase
]).forEach(context => {
  Material.add(context)
  Curriculum.add(context)
  Classroom.add(context)
  ContextBuilder.addContext(context)
})
