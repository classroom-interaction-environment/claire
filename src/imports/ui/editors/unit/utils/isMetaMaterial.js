import { Unit } from '../../../../contexts/curriculum/curriculum/unit/Unit'
import { Phase } from '../../../../contexts/curriculum/curriculum/phase/Phase'

export const isMetaMaterial =  ctx => [Unit, Phase].includes(ctx)
