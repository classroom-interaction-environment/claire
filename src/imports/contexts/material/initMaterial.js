/**
 * CLIENT ONLY! Initializes all material related contexts
 * TODO check if merge with LessonMaterial is feasible?
 * TODO inversion if control by loading all registered Material dynamically
 *
 * @locus client
 */

export const getMaterialContexts = () => {
  import { Dimension } from '../curriculum/curriculum/dimension/Dimension'
  import { Objective } from '../curriculum/curriculum/objective/Objective'
  import { Pocket } from '../curriculum/curriculum/pocket/Pocket'

  import { Unit } from '../curriculum/curriculum/unit/Unit'
  import { Phase } from '../curriculum/curriculum/phase/Phase'

  import { getTaskContexts } from '../tasks/getTaskContexts'

  return [
    Dimension,
    Objective,
    Unit,
    Pocket,
    Phase
  ].concat(getTaskContexts())
}
