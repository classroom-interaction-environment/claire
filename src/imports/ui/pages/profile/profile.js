import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'

import { Router } from '../../../api/routes/Router'
import { Users } from '../../../contexts/system/accounts/users/User'
import { Schema } from '../../../api/schema/Schema'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { Settings } from '../../../contexts/system/settings/Settings'
import { ProfileImages } from '../../../contexts/files/image/ProfileImages'
import { Guide } from '../../tools/guide/guide'
import { i18n } from '../../../api/language/language'
import { FilesTemplates } from '../../../contexts/files/FilesTemplates'

import { dataTarget } from '../../utils/dataTarget'
import { formIsValid, formReset } from '../../components/forms/formUtils'
import { loadTemplate } from '../../../infrastructure/templates/loadTemplate'
import { callMethod } from '../../controllers/document/callMethod'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { getFilesLink } from '../../../contexts/files/getFilesLink'
import { hasProfileImageLoaded } from '../../../api/accounts/user/client/hasProfileImageLoaded'
import { loadProfileImage } from '../../../api/accounts/user/client/loadProfileImage'

import '../../generic/docnotfound/docnotfound'
import '../../components/langselect/langselect'
import '../../components/image/placeholder/imagePlaceholder'
import '../../components/image/image/image'
import './profile.scss'
import './profile.html'

const API = Template.userProfile.setDependencies({
  contexts: [Settings, ProfileImages]
})

const uploadTemplateLoaded = loadTemplate(FilesTemplates.upload)
const imagesTemplateLoaded = loadTemplate(ProfileImages.renderer)

let guide

const UserProfileFormSchema = {
  profileImage: {
    type: String,
    label: 'userProfile.image',
    autoform: {
      label: false,
      afFieldInput: {
        type: FilesTemplates.upload.type,
        accept: ProfileImages.files.accept,
        collection: ProfileImages.name,
        previewTemplate: ProfileImages.renderer.template,
        maxSize: ProfileImages.files.maxSize,
        icon: ProfileImages.icon,
        label: 'userProfile.image',
        capture: ProfileImages.files.capture,
      }
    }
  },
  firstName: {
    type: String,
    label: false
  },
  lastName: {
    type: String,
    label: false
  }
}

const profileSchemas = {}

function decorateUserDoc (userDoc) {
  const locale = { locale: { language: 'en' } }
  const ui = { ui: { fluid: false } }
  const research = {
    research: {
      participate: undefined,
      confirmed: undefined
    }
  }
  return Object.assign({}, { locale, ui, research }, userDoc)
}

Template.userProfile.onCreated(function () {
  const instance = this

  callMethod({
    name: Settings.methods.get,
    args: {},
    failure: err => API.fatal(err),
    success: doc => instance.state.set('settingsDoc', doc)
  })

  /**
   * This method ensures that there is a profile image available for the given user.
   * If the page loads new and the user has a profile image it will be loaded by
   * the respective startup routine.
   * However, this page allows to set a new image and since we don't use pub/sub here
   * we need to ensure the new uploaded image is downloaded again to be available for
   * display.
   * @param user {object} the user document
   */
  const ensureProfileImage = user => {
    if (user.profileImage && !hasProfileImageLoaded(user.profileImage)) {
      instance.state.set('loadingProfileImage', true)
      const onComplete = () => setTimeout(() => instance.state.set('loadingProfileImage', false), 300)
      loadProfileImage({
        user,
        onError: err => {
          API.notify(err)
          onComplete()
        },
        onSuccess: () => onComplete()
      })
    }
  }

  instance.autorun(() => {
    const userId = Router.param('userId')
    instance.state.set('userId', userId)

    // if this is our user, we load their profile with
    // Meteor's current user helpers
    if (userId === Meteor.userId()) {
      const user = Meteor.user()
      instance.state.set('user', user)
      instance.state.set('loadComplete', true)
      ensureProfileImage(user)
    }

    // otherwise we load the respective user's document
    else {
      Meteor.call(Users.methods.getUser.name, { _id: userId }, (err, userDoc) => {
        if (err) {
          API.fatal(err)
        } else {
          const user = decorateUserDoc(userDoc)
          instance.state.set('user', user)
          ensureProfileImage(user)
        }
        instance.state.set('loadComplete', true)
      })
    }
  })
})

Template.userProfile.onRendered(function () {
  const instance = this
  const { status } = instance.data.queryParams

  if (status === 'new') {
    instance.autorun(c => {
      const user = instance.state.get('user')
      const loadComplete = instance.state.get('loadComplete')
      if (!user || !loadComplete) return

      setTimeout(() => {
        guide = Guide.buildTour({ allowClose: true, opacity: 0.5 })
          .addStep({
            target: '#user-profile-overview',
            title: i18n.get('user.profile.guide'),
            description: i18n.get('user.profile.overview')
          })
          .addStep({
            target: '#user-profile-image',
            title: i18n.get('user.profile.guide'),
            description: i18n.get('user.profile.image')
          })
          .addStep({
            target: '#user-fixed-data',
            title: i18n.get('user.profile.guide'),
            description: i18n.get('user.profile.fixed')
          })
          .addStep({
            target: '#user-profile-research',
            title: i18n.get('user.profile.guide'),
            description: i18n.get('user.profile.research')
          })
          .complete()
        guide.start()
      }, 500)
      c.stop()
    })
  }
})

Template.userProfile.helpers({
  loadComplete () {
    return uploadTemplateLoaded.get() &&
      imagesTemplateLoaded.get() &&
      Template.getState('loadComplete')
  },
  user () {
    return Template.getState('user')
  },
  edit (fieldName) {
    return Template.getState('edit') === fieldName
  },
  canEditSettings () {
    const userId = Meteor.userId()
    return UserUtils.isAdmin(userId) || Template.getState('userId') === userId
  },
  getUserGroups (roles) {
    return roles && Object.keys(roles)
  },
  getUserRoles (roles, group) {
    return roles && roles[group]
  },
  loadingProfileImage () {
    return Template.getState('loadingProfileImage')
  },
  profileImage (imageId) {
    const image = getLocalCollection(ProfileImages.name).findOne(imageId)

    if (!image) {
      return
    }

    return getFilesLink({
      file: image,
      name: ProfileImages.name,
      version: 'thumbnail'
    })
  },
  profileImageDoc () {
    const user = Meteor.user()
    return { fileId: user && user.profileImage }
  },
  profileSchema (fieldName) {
    if (!profileSchemas[fieldName]) {
      const schema = UserProfileFormSchema[fieldName]
      profileSchemas[fieldName] = Schema.create({ [fieldName]: schema }, { tracker: Tracker })
    }
    return profileSchemas[fieldName]
  },
  deleteProfileImage () {
    return Template.getState('deleteProfileImage')
  },
  settingsDoc () {
    return Template.getState('settingsDoc')
  },
  participateNotVisible () {
    return !Template.getState('participateVisible')
  },
  sendParticipation () {
    return Template.getState('sendParticipation')
  }
})

Template.userProfile.events({
  'click .edit-profile-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    templateInstance.state.set('edit', target)
  },
  'click .cancel-edit-button' (event, templateInstance) {
    event.preventDefault()
    formReset('editProfileForm')
    templateInstance.state.set('edit', false)
  },
  'click .delete-profile-image': async function (event, templateInstance) {
    const { profileImage } = Meteor.user()

    await callMethod({
      name: ProfileImages.methods.remove.name,
      args: { _id: profileImage },
      prepare: () => templateInstance.state.set('deleteProfileImage', true),
      receive: () => templateInstance.state.set('deleteProfileImage', false),
      failure: er => API.notify(er)
    })

    await callMethod({
      name: Users.methods.updateProfile.name,
      args: { profileImage: null },
      failure: er => API.notify(er),
      receive: () => {
        API.notify('form.updateComplete')
        templateInstance.state.set('editProfileImage', false)
        formReset('profileImageForm')
      }
    })
  },
  'change .research-option-select' (event, templateInstance) {
    const form = templateInstance.$('#researchOptionsForm').get(0)
    const formData = new FormData(form)
    const participateVisible = Array.from(formData.values()).every(val => !!val)
    templateInstance.state.set({ participateVisible })
  },
  'hidden.bs.modal #resarch-optin-modal' (event, templateInstance) {
    const form = templateInstance.$('#researchOptionsForm').get(0)
    form.reset()
    templateInstance.state.set({ participateVisible: false })
  },
  'click .research-optin-button' (event, templateInstance) {
    event.preventDefault()
    if (guide) {
      guide.reset()
      guide = null
    }
    API.showModal('resarch-optin-modal')
  },
  'click .research-optout-button' (event, templateInstance) {
    event.preventDefault()

    // TODO CONFIRM MODAL!

    callMethod({
      name: Users.methods.setResearch,
      args: { participate: false },
      prepare: () => templateInstance.state.set('deleteProfileImage', true),
      receive: () => templateInstance.state.set('deleteProfileImage', false),
      failure: er => API.notify(er),
      success: () => API.notify()
    })
  },
  'click .research-resend-button' (event, templateInstance) {
    callMethod({
      name: Users.methods.setResearch,
      args: { participate: true },
      prepare: () => templateInstance.state.set('sendParticipation', true),
      receive: () => templateInstance.state.set('sendParticipation', false),
      failure: er => API.notify(er),
      success: () => API.notify()
    })
  },
  'submit #editProfileForm' (event, templateInstance) {
    event.preventDefault()
    const fieldName = templateInstance.state.get('edit')
    const insertDoc = formIsValid(profileSchemas[fieldName], 'editProfileForm')
    if (!insertDoc) return

    Meteor.call(Users.methods.updateProfile.name, insertDoc, (err, res) => {
      if (err) {
        API.notify(err)
      } else {
        API.notify('form.updateComplete')
        templateInstance.state.set('edit', false)
        formReset('editProfileForm')
      }
    })
  },
  'submit #researchOptionsForm' (event, templateInstance) {
    event.preventDefault()

    callMethod({
      name: Users.methods.setResearch,
      args: { participate: true },
      prepare: () => templateInstance.state.set('sendParticipation', true),
      receive: () => templateInstance.state.set('sendParticipation', false),
      failure: er => API.notify(er),
      success: () => {
        API.hideModal('resarch-optin-modal')
        API.notify()
      }
    })
  }
})
