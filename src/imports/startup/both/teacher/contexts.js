import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'
import { Version } from '../../../contexts/system/version/Version'
import { CodeInvitation } from '../../../contexts/classroom/invitations/CodeInvitations'
import { Errors } from '../../../contexts/system/errors/Errors'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { Settings } from '../../../contexts/system/settings/Settings'
import { TaskResults } from '../../../contexts/tasks/results/TaskResults'
import { TaskWorkingState } from '../../../contexts/tasks/results/TaskWorkingState'
import { Users } from '../../../contexts/system/accounts/users/User'

[
  Admin,
  Beamer,
  CodeInvitation,
  Errors,
  Lesson,
  Settings,
  SchoolClass,
  TaskResults, // TODO defer loading to respective pages
  TaskWorkingState // TODO defer loading to respective pages
].forEach(context => {
  console.info('register context', context.name)
  ContextRegistry.add(context)
})

ContextRegistry.add(Users, { createCollection: false })
ContextRegistry.add(Version, { createCollection: false, createPublications: false })
