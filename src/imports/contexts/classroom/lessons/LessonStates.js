import { LessonStatesDefinitions } from './LessonStatesDefinitions'
import { LessonErrors } from './LessonErrors'

const isIdle = ({ startedAt, completedAt }) => !startedAt && !completedAt

const isRunning = ({ startedAt, completedAt }) => !!(startedAt && !completedAt)

const isCompleted = ({ startedAt, completedAt }) => !!(startedAt && completedAt)

const canEdit = ({ startedAt, completedAt }) => isIdle({ startedAt, completedAt })

const canStart = ({ startedAt, completedAt }) => isIdle({ startedAt, completedAt })

const canStop = ({ startedAt, completedAt }) => isRunning({ startedAt, completedAt })

const canComplete = ({ startedAt, completedAt }) => isRunning({ startedAt, completedAt })

const canResume = ({ startedAt, completedAt }) => isCompleted({ startedAt, completedAt })

const canRestart = ({ startedAt, completedAt }) => isRunning({ startedAt, completedAt }) ||
  isCompleted({ startedAt, completedAt })

const canToggle = ({ startedAt, completedAt }) => canRestart({ startedAt, completedAt })

const getState = ({ startedAt, completedAt }) => {
  if (isCompleted({ startedAt, completedAt })) {
    return LessonStatesDefinitions.completed
  }
  if (isRunning({ startedAt, completedAt })) {
    return LessonStatesDefinitions.running
  }
  if (isIdle({ startedAt, completedAt })) {
    return LessonStatesDefinitions.idle
  }
  throw new Error(LessonErrors.unexpectedState)
}

export const LessonStates = {
  isIdle,
  isRunning,
  isCompleted,
  getState,
  canEdit,
  canStart,
  canStop,
  canComplete,
  canResume,
  canRestart,
  canToggle
}
