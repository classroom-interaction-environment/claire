export const GroupMode = {
  /**
   * No group mode active at all
   */
  off: {
    index: 0,
    value: 'off',
    label: 'groupMode.off',
    icon: 'off'
  },
  /**
   * One answers for all, answers will override each other
   */
  override: {
    index: 1,
    value: 'override',
    label: 'groupMode.override',
    icon: 'user'
  },

  /**
   * All work on the same answer, individual values will be merged
   * into one final answer.
   */
  merge: {
    index: 2,
    value: 'merge',
    label: 'groupMode.merge',
    icon: 'users'
  }
}
