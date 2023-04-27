import { Meteor } from 'meteor/meteor'
import { Schema } from '../../../../../api/schema/Schema'
import { Group } from '../../../../../contexts/classroom/group/Group'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { $in } from '../../../../../api/utils/query/inSelector'
import { getFullName } from '../../../../../api/accounts/emailTemplates/common'
import { callMethod } from '../../../../controllers/document/callMethod'

export const createGroupForms = ({ translate, onError }) => {
  const groupForms = {}
  const viewGroupSchema = Schema.create({
    title: Group.schema.title,
    users: {
      type: Array,
      label: () => translate('group.users'),
      autoform: {
        type: 'docList'
      }
    },
    'users.$': {
      type: Object,
      blackbox: true
    },
    phases: {
      type: Array,
      label: () => translate('group.phases'),
      autoform: {
        type: 'docList'
      }
    },
    'phases.$': {
      type: Object,
      blackbox: true
    },
    material: {
      type: Array,
      label: () => translate('group.material'),
      autoform: {
        type: 'docList'
      }
    },
    'material.$': {
      type: Object,
      blackbox: true
    }
  })

  const toGroupViewDoc = ({ groupDoc, material }) => {
    const finalDoc = { ...groupDoc }
    finalDoc.users = groupDoc.users
      .map(({ userId, role }) => {
        const userDoc = Meteor.users.findOne(userId)
        const name = userDoc && getFullName(userDoc)
        const title = role ? `${role}: ${name || userId}` : `${name || userId}`
        return { title }
      })
      .sort((a, b) => a.title.localeCompare(b.title))

    if (groupDoc.phases) {
      const phaseDocs = getLocalCollection(Phase.name).find({ _id: $in(groupDoc.phases) })
      finalDoc.phases = phaseDocs.map(doc => ({ title: doc.title }))
    }

    if (groupDoc.material) {
      finalDoc.material = groupDoc.material.map(materialId => {
        const materialDoc = material.find(mat => mat.value === materialId)
        return materialDoc
          ? { title: materialDoc.label }
          : { title: materialId }
      })
    }
    return finalDoc
  }

  groupForms.view = {
    action: 'view',
    custom: {},
    cancel: () => translate('actions.close'),
    schema: viewGroupSchema,
    doc: toGroupViewDoc,
    load: async () => {
      await import('../../../../forms/doclist/docList')
    }
  }

  groupForms.remove = {
    action: 'remove',
    schema: viewGroupSchema,
    doc: toGroupViewDoc,
    validation: 'none',
    load: async () => {
      await import('../../../../forms/doclist/docList')
    },
    onSubmit ({ groupId }) {
      return callMethod({
        name: Group.methods.delete,
        args: { _id: groupId },
        failure: onError
      })
    }
  }

  return groupForms
}
