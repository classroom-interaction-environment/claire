/**
 * Low-level definitions for possible lesson states. Please use {LessonStates}
 * instead of this.
 */
export const LessonStatesDefinitions = {

  /**
   * The lesson is neither running nor completed.
   */

  idle: {
    name: 'idle',
    label: 'lesson.states.idle',
    icon: 'clock',
    timeMode: {
      label: 'common.lastUpdated',
      field: 'updatedAt'
    },
    color: 'secondary'
  },

  /**
   * The lesson is running. Dies not necessarily mean, that teaching is active.
   */

  running: {
    name: 'running',
    label: 'lesson.states.running',
    icon: 'play',
    timeMode: {
      label: 'common.startedAt',
      field: 'startedAt'
    },
    color: 'warning'
  },

  /**
   * The lesson has ended and there won't be no more teaching / exercises.
   */

  completed: {
    name: 'completed',
    label: 'lesson.states.completed',
    icon: 'check',
    timeMode: {
      label: 'common.completedAt',
      field: 'completedAt'
    },
    color: 'success'
  }
}
