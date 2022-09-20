import { Lang } from '../../utils/Translate'

export const ToolTypes = {
  type: Number,
  entries: {
    SKETCHPAD: {
      label: Lang.translateReactive('tools.sketchpad'),
      value: 0
      // ref: classname here
    },
    PRESENTATION: {
      label: Lang.translateReactive('tools.presentation'),
      value: 1
    }
  }
}
