export const phaseGroupSchema = ({ phases, translate }) => {
  return {
    phases: {
      label: translate('group.phases'),
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
    }
  }
}