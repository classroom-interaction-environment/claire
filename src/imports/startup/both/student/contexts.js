import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'
import { Users } from '../../../contexts/system/accounts/users/User'
import { CodeInvitation } from '../../../contexts/classroom/invitations/CodeInvitations'
import { Language } from '../../../api/language/language'
import { Errors } from '../../../contexts/system/errors/Errors'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { TaskResults } from '../../../contexts/tasks/results/TaskResults'
import { TaskWorkingState } from '../../../contexts/tasks/state/TaskWorkingState'

[
  CodeInvitation,
  Errors,
  Lesson,
  SchoolClass,
  TaskResults,
  TaskWorkingState
].forEach(context => ContextRegistry.add(context))

ContextRegistry.add(Users, { createCollection: false })
ContextRegistry.add(Language, { createCollection: false, createPublications: false, createMethods: true })
