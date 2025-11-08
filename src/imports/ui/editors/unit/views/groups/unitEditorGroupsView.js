import { Template } from 'meteor/templating'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { LessonMaterial } from '../../../../controllers/LessonMaterial'
import { Users } from '../../../../../contexts/system/accounts/users/User'
import { ProfileImages } from '../../../../../contexts/files/image/ProfileImages'
import { Group } from '../../../../../contexts/classroom/group/Group'
import { unitEditorSubscriptionKey } from '../../unitEditorSubscriptionKey'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { $in } from '../../../../../api/utils/query/inSelector'
import { findUnassociatedMaterial } from '../../../../../api/utils/findUnassociatedMaterial'
import { uniqueGroupMaterialContexts } from './uniqueGroupMaterialContexts'
import '../../../groups/groupsEditor'
import './unitEditorGroupsView.html'

/* unit group view
 * Allows to edit "global" units, which are valid for any lesson,
 * related to this unit.
 *
 * Static data:
 * - phases
 * - profile images
 * - users
 * - lesson material
 *
 * Dynamic data:
 * - groups
 *
 */

const API = Template.unitEditorGroupsView.setDependencies({
  contexts: uniqueGroupMaterialContexts(Phase, Unit, ProfileImages, Users, Group),
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
    if (!unitDoc) {
      return
    }

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


    // the lesson material is separately loaded, once the material has all been
    // initialized and is ready
    LessonMaterial.load(unitDoc)
      .then((material) => {
        API.debug('material loaded', material)
        const unassociatedMaterial = findUnassociatedMaterial(unitDoc)
        instance.state.set({
          materialLoaded: true,
          unassociatedMaterial
        })
      })
      .catch(err => {
        if (err) {
          API.notify(err)
        }
      })

    // subscriptions:
    // - my groups

    API.subscribe({
      key: unitEditorSubscriptionKey,
      name: Group.publications.my,
      args: { unitId: unitDoc._id },
      callbacks: {
        onError: API.fatal,
        onReady: () => instance.state.set({ groupSubscriptionComplete: true })
      }
    })

    // class related data is not available in curriculum mode
    // so we skip loading profile images and users then
    if (classDoc) {
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
    }
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
