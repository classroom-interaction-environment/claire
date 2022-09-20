import { Lang } from '../../utils/Translate'

/**
 * @deprecated
 */
export const CommunicationType = {
  name: 'CommunicationType',
  label: Lang.translateReactive('types.CommunicationType'),
  type: Number,
  entries: {
    SINGLE: {
      label: Lang.translateReactive('communication.single'),
      value: 0
    },
    ONE_TO_ONE: {
      label: Lang.translateReactive('communication.one2one'),
      value: 1
    },
    ONE_TO_MANY: {
      label: Lang.translateReactive('communication.one2many'),
      value: 2
    },
    MANY_TO_ONE: {
      label: Lang.translateReactive('communication.many2one'),
      value: 3
    },
    MANY_TO_MANY: {
      label: Lang.translateReactive('communication.many2many'),
      value: 4
    },
    SINGLE_ASYNC: {
      label: `${Lang.translateReactive('communication.single')} ${Lang.translateReactive('common.async')}`,
      value: 5
    },
    ONE_TO_ONE_ASYNC: {
      label: `${Lang.translateReactive('communication.one2one')} ${Lang.translateReactive('common.async')}`,
      value: 6
    },
    ONE_TO_MANY_ASYNC: {
      label: `${Lang.translateReactive('communication.one2many')} ${Lang.translateReactive('common.async')}`,
      value: 7
    },
    MANY_TO_ONE_ASYNC: {
      label: `${Lang.translateReactive('communication.many2one')} ${Lang.translateReactive('common.async')}`,
      value: 8
    },
    MANY_TO_MANY_ASYNC: {
      label: `${Lang.translateReactive('communication.many2many')} ${Lang.translateReactive('common.async')}`,
      value: 9
    }
  }

}
