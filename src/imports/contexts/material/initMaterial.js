/**
 * CLIENT ONLY! Initializes all material related contexts
 * TODO check if merge with LessonMaterial is feasible?
 * TODO inversion if control by loading all registered Material dynamically
 *
 * @locus client
 */

export const getMaterialContexts = () => {
  const { Dimension } = require('../curriculum/curriculum/dimension/Dimension')
  const { Objective } = require('../curriculum/curriculum/objective/Objective')
  const { Pocket } = require('../curriculum/curriculum/pocket/Pocket')

  const { Unit } = require('../curriculum/curriculum/unit/Unit')
  const { Phase } = require('../curriculum/curriculum/phase/Phase')

  const { getTaskContexts } = require('../tasks/getTaskContexts')

  return [
    Dimension,
    Objective,
    Unit,
    Pocket,
    Phase
  ].concat(getTaskContexts())
}
