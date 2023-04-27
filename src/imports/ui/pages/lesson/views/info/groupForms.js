import { Schema } from '../../../../../api/schema/Schema'
import { Group } from '../../../../../contexts/classroom/group/Group'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { $in } from '../../../../../api/utils/query/inSelector'
import { getFullName } from '../../../../../api/accounts/emailTemplates/common'
import { callMethod } from '../../../../controllers/document/callMethod'
import { GroupBuilder } from '../../../../../contexts/classroom/group/GroupBuilder'
import { editGroupSchema } from '../../../../forms/groupbuilder/api/editGroupSchema'
import { getUser } from '../../../../../contexts/system/accounts/users/getUser'
import { phaseGroupSchema } from '../../../../forms/groupbuilder/api/phaseGroupSchema'

export const createGroupForms = ({ translate, onError }) => {
  const groupForms = {}
  const viewGroupSchema = Schema.create({
    title: Group.schema.title,
    users: {
      type: Array,
      label: () => translate('group.users'),
      autoform: {
        // we don't need renderers for this doc list, since
        // we have already resolved the docs wo a doc with title prop
        // in the way it's readable
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

    if (groupDoc.users) {
      finalDoc.users = groupDoc.users
        .map(({ userId, role }) => {
          const userDoc = getUser(userId)
          const name = userDoc && getFullName(userDoc)
          const title = role ? `${role}: ${name || userId}` : `${name || userId}`
          return { title }
        })
        .sort((a, b) => a.title.localeCompare(b.title))
    }

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

  groupForms.update = {
    action: 'update',
    custom: {},
    cancel: () => translate('actions.close'),
    doc: ({ groupDoc }) => groupDoc,
    schema: ({ groupDoc, classDoc, material, phases }) => {
      const groupBuilder = new GroupBuilder({ groupTitleDefault: groupDoc.title })
      groupBuilder.setOptions({
        users: classDoc?.students,
        material: material.map(({ value }) => value),
        maxGroups: 1
      })

      groupBuilder.addGroup(groupDoc)

      const editSchemaOptions = { material }
      const editSchema = editGroupSchema(groupBuilder, editSchemaOptions)
      const phaseSchema = phaseGroupSchema({ phases, translate })
      return Schema.create({ ...editSchema, ...phaseSchema })
    },
    validation: 'none',
    onSubmit ({ doc, groupDoc }) {
      const updateDoc = doc.$set.groups[0]
      if (doc.$set.phases) updateDoc.phases = doc.$set.phases

      return callMethod({
        name: Group.methods.update,
        args: { _id: groupDoc._id, ...updateDoc },
        failure: onError
      })
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
