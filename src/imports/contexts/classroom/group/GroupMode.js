export const GroupMode = {
  /**
   * No group mode active at all
   */
  off: {
    index: 0,
    value: 'off',
    label: 'groupMode.off',
  },
  /**
   * One answers for all, answers will override each other
   */
  override: {
    index: 1,
    value: 'override',
    label: 'groupMode.override'
  },
  /**
   * Each person answers for themselves
   */
  split: {
    index: 2,
    value: 'split',
    label: 'groupMode.split'
  },
  /**
   * All work on the same answer, individual values will be merged
   * into one final answer.
   */
  merge: {
    index: 3,
    value: 'merge',
    label: 'groupMode.merge'
  }
}
