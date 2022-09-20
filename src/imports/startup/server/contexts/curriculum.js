import { Pocket } from '../../../contexts/curriculum/curriculum/pocket/Pocket'
import { Dimension } from '../../../contexts/curriculum/curriculum/dimension/Dimension'
import { Objective } from '../../../contexts/curriculum/curriculum/objective/Objective'
import { Task } from '../../../contexts/curriculum/curriculum/task/Task'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Curriculum } from '../../../contexts/curriculum/Curriculum'
import { Classroom } from '../../../contexts/classroom/Classroom'
import { ContextBuilder } from '../../../infrastructure/datastructures/ContextBuilder'
import { curriculumPipeline } from '../../../contexts/curriculum/curriculumPipeline'

Curriculum.info('register default curriculum')

ContextBuilder.addRegistry(Curriculum, {
  pipelines: [curriculumPipeline]
})

;[Pocket, Dimension, Objective, Task, Unit].forEach(context => {
  Curriculum.add(context)
  Classroom.add(context)
  ContextBuilder.addContext(context)
})
