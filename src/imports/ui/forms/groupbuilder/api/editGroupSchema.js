import '../../users/userGroupSelect'
import { translateReactive } from '../../../../utils/translateReactive'

/**
 * Creates a schema definition for editing groups
 * @param groupBuilderInstance {GroupBuilder}
 * @param options {object=} optional
 * @param options.material {[{ label:string, value: string }]} object of material docs with value/label combination of
 *  all available materials
 * @return {object} schema definition object
 */
export const editGroupSchema = (groupBuilderInstance, options = {}) => {
  const { users = [], maxUsers, maxGroups } = groupBuilderInstance
  const minCount = maxUsers
    ? Math.floor(users.length / maxUsers)
    : 1

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
      optional: !groupBuilderInstance.atLeastOneUserRequired,
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
