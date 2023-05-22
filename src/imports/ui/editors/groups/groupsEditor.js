import { Template } from 'meteor/templating'
import { Group } from '../../../contexts/classroom/group/Group'
import { Phase } from '../../../contexts/curriculum/curriculum/phase/Phase'
import { FormModal } from '../../components/forms/modal/formModal'
import { cursor } from '../../../api/utils/cursor'
import { getCollection } from '../../../api/utils/getCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { dataTarget } from '../../utils/dataTarget'
import { createGroupForms } from '../../pages/lesson/views/info/groupForms'
import { getParentView } from '../../blaze/getParentView'
import { callMethod } from '../../controllers/document/callMethod'
import groupsLang from './i18n/groupsLang'
import '../../../ui/forms/groupbuilder/groupBuilder'
import './groupsEditor.html'

const API = Template.groupsEditor.setDependencies({ contexts: [Group], language: groupsLang })
const groupForms = createGroupForms({ onError: API.notify, translate: API.translate })

Template.groupsEditor.onCreated(function () {
  const instance = this
  const { classDoc, unitDoc } = instance.data
  const parent = getParentView({ view: instance.view, skipSame: true })

  /**
   * Executes a group action
   * @param action {string} name of the action, one of 'create', 'view', 'update', 'delete'
   * @param groupId {string=} optional doc _id, undefined for 'create' action
   * @return {*}
   */
  instance.onAction = ({ action, groupId }) => {
    const groupDoc = groupId && getCollection(Group.name).findOne(groupId)

    if (action === 'create') {
      instance.state.set({
        groupBuilderActive: true,
        groupEditMode: action
      })
      return API.showModal('manageGroupModal')
    }

    const material = instance.state.get('materialOptions')
    const phases = instance.state.get('phases')
    const definitions = groupForms[action]
    const doc = definitions.doc || groupDoc
    const options = {
      action,
      doc: doc,
      bind: { groupId, groupDoc, classDoc, material, phases },
      hideLegend: true,
      ...definitions
    }
    return FormModal.show(options)
  }

  // the action buttons are usually located in a parent template
  // and we can't access the parent's scope for events
  Template[parent.name.split('.')[1]].events({
    'click .groups-action-btn' (event, parentInstance) {
      const action = dataTarget(event, parentInstance, 'action')
      const groupId = dataTarget(event, parentInstance, 'id')
      instance.onAction({ action, groupId })
    }
  })

  /**
   * Returns the respective group documents as cursor.
   * @return {*}
   */
  instance.getGroups = () => {
    const query = {
      unitId: unitDoc._id
    }
    return getCollection(Group.name).find(query)
  }

  /**
   * Once we recive the groups from groupBuilder we
   * can save them, depending on the current state
   * @async
   * @param groupSettings {object}
   * @param groupsDoc {Array<Object>}
   * @return {Promise<void>}
   */
  instance.onGroupCreated = async ({ groupSettings, groupsDoc }) => {
    const groups = groupsDoc.groups.map(group => {
      group.classId = classDoc?._id
      group.unitId = unitDoc?._id
      group.phases = groupSettings.phases
      return group
    })

    for (const doc of groups) {
      await callMethod({
        name: Group.methods.save,
        args: doc,
        failure: API.notify
      })
    }

    instance.state.set('addGroups', false)
    API.hideModal('manageGroupModal')
    API.notify(true)
  }

  // we need to autorun here, because the material may not be loaded
  // when the template is complete
  instance.autorun(() => {
    const data = Template.currentData()
    const { phases = [], unassociatedMaterial } = data
    const phaseMaterial = []

    phases.forEach(phase => {
      if (phase.references) {
        phaseMaterial.push(...phase.references)
      }
    })

    const materialOptions = (unassociatedMaterial || [])
      .concat(phaseMaterial)
      .map(({ collection, document }) => {
        const value = document
        const materialDoc = getLocalCollection(collection).findOne(document)
        const label = materialDoc?.title || materialDoc?.name
        return { value, label }
      })

    instance.state.set({ materialOptions, phases })
  })
})

Template.groupsEditor.helpers({
  groups () {
    return cursor(Template.instance().getGroups)
  },
  phaseDocs (phaseIds) {
    return phaseIds && cursor(() => getLocalCollection(Phase.name).find({ _id: { $in: phaseIds } }))
  },
  groupBuilderAtts () {
    const instance = Template.instance()
    const data = Template.currentData()

    if (!instance.state.get('groupBuilderActive')) {
      return // skip to prevent offscreen drawing
    }
    return {
      lessonDoc: data.lessonDoc,
      unitDoc: data.unitDoc,
      classDoc: data.classDoc,
      phases: data.phases ?? [],
      material: instance.state.get('materialOptions'),
      onCreated: instance.onGroupCreated
    }
  },
  groupEditMode () {
    return Template.getState('groupEditMode')
  }
})

Template.groupsEditor.events({
  'hidden.bs.modal #manageGroupModal' (event, templateInstance) {
    templateInstance.state.set({
      groupBuilderActive: false,
      groupEditMode: null
    })
  },
  'click .groups-action-btn' (event, templateInstance) {
    const action = dataTarget(event, templateInstance, 'action')
    const groupId = dataTarget(event, templateInstance, 'id')
    templateInstance.onAction({ action, groupId })
  }
})
