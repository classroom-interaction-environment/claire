import '../../../forms/users/userGroupSelect'
import { translateReactive } from '../../../../utils/translateReactive'

export const editGroupSchema = (groupBuilderInstance, options) => {
  const { users = [], maxUsers, maxGroups /*, materialForAllGroups, roles = [], material = [] */ } = groupBuilderInstance
  const minCount = Math.floor(users.length / (maxUsers || 1))

  return {
    groups: {
      type: Array,
      label: translateReactive('group.groups'),
      minCount: minCount,
      maxCount: maxGroups > 0 ? maxGroups : undefined,
      autoform: {
        label: false,
        type: 'userGroupSelect',
        builder: groupBuilderInstance,
        allMaterial: options.material
      }
    },
    'groups.$': {
      type: Object,
      label: translateReactive('group.title')
    },

    'groups.$.title': String,
    'groups.$.users': {
      type: Array,
      label: translateReactive('group.users'),
      minCount: 1
    },
    'groups.$.users.$': {
      type: Object
    },
    'groups.$.users.$.role': {
      type: String,
      optional: true
    },
    'groups.$.users.$.userId': {
      type: String
    },
    'groups.$.material': {
      type: Array,
      optional: true
    },
    'groups.$.material.$': {
      type: String
    },
    'groups.$.phases': {
      type: Array,
      optional: true
    },
    'groups.$.phases.$': {
      type: String
    }
  }
}
