import { Template } from 'meteor/templating'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { LessonMaterial } from '../../../../controllers/LessonMaterial'
import { Users } from '../../../../../contexts/system/accounts/users/User'
import { ProfileImages } from '../../../../../contexts/files/image/ProfileImages'
import { Group } from '../../../../../contexts/classroom/group/Group'
import { unitEditorSubscriptionKey } from '../../unitEditorSubscriptionKey'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { $in } from '../../../../../api/utils/query/inSelector'
import { findUnassociatedMaterial } from '../../../../../api/utils/findUnassociatedMaterial'
import '../../../groups/groupsEditor'
import './unitEditorGroupsView.html'

const API = Template.unitEditorGroupsView.setDependencies({
  contexts: [...(new Set([Phase, Unit, ProfileImages, Users, Group].concat(getMaterialContexts()))).values()],
  debug: true
})

Template.unitEditorGroupsView.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    if (!API.initComplete()) {
      return
    }

    instance.state.set('loadComplete', false)
    const data = Template.currentData()
    const { unitDoc, classDoc } = data
    const phasesList = unitDoc.phases || []

    loadIntoCollection({
      name: Phase.methods.all,
      args: { ids: phasesList },
      collection: getLocalCollection(Phase.name),
      success: () => {
        const phases = getLocalCollection(Phase.name).find({ _id: $in(phasesList) }).fetch()
        instance.state.set({ phases })
      },
      failure: API.notify
    })

    loadIntoCollection({
      name: ProfileImages.methods.byClass,
      args: { classId: classDoc._id },
      collection: getLocalCollection(ProfileImages.name),
      failure: API.notify,
      success: () => instance.state.set('profileImagesReady', true)
    })

    loadIntoCollection({
      name: Users.methods.byClass,
      args: { classId: classDoc._id },
      collection: getLocalCollection(Users.name),
      failure: API.notify,
      success: () => instance.state.set('usersReady', true)
    })

    LessonMaterial.load(unitDoc, (err, material) => {
      API.debug('material loaded', err, material)
      const unassociatedMaterial = findUnassociatedMaterial(unitDoc)
      instance.state.set({
        materialLoaded: true,
        unassociatedMaterial
      })
    })

    API.subscribe({
      name: Group.publications.my,
      args: { unitId: unitDoc._id },
      key: unitEditorSubscriptionKey,
      callbacks: {
        onError: API.fatal,
        onReady: () => instance.state.set({ groupSubscriptionComplete: true })
      }
    })
  })
})

Template.unitEditorGroupsView.helpers({
  groupsEditorAtts () {
    const { classDoc, unitDoc } = Template.currentData()
    const phases = Template.getState('phases')
    const unassociatedMaterial = Template.getState('unassociatedMaterial')

    return {
      lessonDoc: null,
      classDoc,
      unitDoc,
      phases,
      unassociatedMaterial
    }
  }
})
