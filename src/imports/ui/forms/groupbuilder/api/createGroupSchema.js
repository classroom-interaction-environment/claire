/* global AutoForm */
import { Integer } from '../../../../api/schema/Schema'
import { phaseGroupSchema } from './phaseGroupSchema'

export const createGroupsSchema = ({ phases, material, translate }) => ({
  maxUsers: {
    label: translate('group.numUsers'),
    type: Integer,
    min: 1,
    autoform: {
      defaultValue: 1,
      min: 1,
      group: 'nums',
      'formgroup-class': 'col-12 col-md-6 float-left'
    }
  },
  maxGroups: {
    label: translate('group.maxGroups'),
    type: Integer,
    min: 1,
    autoform: {
      min: 1,
      defaultValue: 1,
      group: 'nums',
      'formgroup-class': 'col-12 col-md-6 float-right'
    }
  },

  roles: {
    type: Array,
    label: translate('roles.title'),
    optional: true
  },

  'roles.$': String,

  ...phaseGroupSchema({ phases, translate }),

  material: {
    label: translate('group.material'),
    type: Array,
    optional: true,
    autoform: {
      type: () => {
        if (!material?.length) return 'hidden'
      }
    }
  },
  'material.$': {
    type: String,
    autoform: {
      firstOption: translate('form.selectOne'),
      options: () => material
    }
  },
  materialForAllGroups: {
    type: Boolean,
    label: translate('groupBuilder.materialForAllGroups'),
    optional: true,
    autoform: {
      defaultValue: false,
      group: 'booleans',
      type: () => {
        if (!material?.length) return 'hidden'
      },
      disabled: () => {
        const materialAutoShuffle = AutoForm.getFieldValue('materialAutoShuffle')
        if (materialAutoShuffle) return true
      },
      afFieldInput: {
        'class': 'ml-3',
      }
    }
  },
  materialAutoShuffle: {
    type: Boolean,
    label: translate('groupBuilder.materialAutoShuffle'),
    optional: true,
    autoform: {
      defaultValue: false,
      group: 'booleans',
      type: () => {
        if (!material?.length) return 'hidden'
      },
      disabled: () => {
        const materialForAllGroups = AutoForm.getFieldValue('materialForAllGroups')
        if (materialForAllGroups) return true
      },
      afFieldInput: {
        'class': 'ml-3',
      }
    }
  }
})
