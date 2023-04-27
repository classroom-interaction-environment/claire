/* global AutoForm */
export const createGroupsSchema = ({ phases, material, translate }) => ({
  maxUsers: {
    label: translate('group.maxUsers'),
    type: Number,
    min: 2,
    autoform: {
      defaultValue: 2
    }
  },

  roles: {
    type: Array,
    label: translate('roles.title'),
    optional: true
  },

  'roles.$': String,

  phases: {
    label: translate('lesson.phases.title'),
    type: Array,
    optional: true,
    autoform: {
      type: () => {
        if (phases?.length === 0) {
          return 'hidden'
        }
      }
    }
  },
  'phases.$': {
    type: String,
    autoform: {
      firstOption: translate('form.selectOne'),
      options: () => (phases || []).map(doc => doc && ({
        value: doc._id,
        label: doc.title
      }))
    }
  },
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
      }
    }
  }
})
