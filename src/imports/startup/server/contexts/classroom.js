import { Beamer } from '../../../contexts/beamer/Beamer'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { TaskResults } from '../../../contexts/tasks/results/TaskResults'
import { TaskWorkingState } from '../../../contexts/tasks/state/TaskWorkingState'
import { CodeInvitation } from '../../../contexts/classroom/invitations/CodeInvitations'
import { Classroom } from '../../../contexts/classroom/Classroom'
import { ContextBuilder } from '../../../infrastructure/datastructures/ContextBuilder'
import { classroomPipeline } from '../../../contexts/classroom/classroomPipeline'
import { Group } from '../../../contexts/classroom/group/Group'

Classroom.info('register default classroom')

ContextBuilder.addRegistry(Classroom, {
  pipelines: [classroomPipeline]
})

;[
  Beamer,
  SchoolClass,
  Lesson,
  TaskResults,
  TaskWorkingState,
  CodeInvitation,
  Group
].forEach(context => {
  Classroom.add(context)
  ContextBuilder.addContext(context)
})
