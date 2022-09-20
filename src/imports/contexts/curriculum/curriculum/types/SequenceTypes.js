import { Lang } from '../../utils/Translate'

export const SequenceTypes = {
  TYPE: Number,

  entries: {
    LEARNING: {
      label: Lang.translateReactive('sequence.learning'),
      value: 0
    },
    START: {
      label: Lang.translateReactive('sequence.start'),
      value: 1
    },
    REFLECTION: {
      label: Lang.translateReactive('sequence.end'),
      value: 2
    }
  }
}

SequenceTypes.entryValues = Object.values(SequenceTypes.entries)
