import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { Admin } from '../../../../../contexts/system/accounts/admin/Admin'
import { Schema } from '../../../../../api/schema/Schema'
import { dataTarget } from '../../../../utils/dataTarget'
import { formIsValid, formReset } from '../../../../components/forms/formUtils'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { callMethod } from '../../../../controllers/document/callMethod'
import './users.html'

const createUserSchema = Schema.create(Admin.methods.createUser.schema, { tracker: Tracker })
const updateSchemas = new Map()
updateSchemas.set('role', Schema.create(Admin.methods.updateRole.schema, { tracker: Tracker }))

const API = Template.adminUsers.setDependencies({})

Template.adminUsers.onCreated(function () {
  const instance = this
  instance.users = new Mongo.Collection(null)
  instance.state.set('showInst', {
    [undefined]: false
  })

  instance.loadUsers = ({ ids } = {}) => {
    const args = {}
    if (ids) { args.ids = ids }

    callMethod({
      name: Admin.methods.users,
      args: args,
      failure: API.notify,
      success: users => {
        const showInst = {}
        const institutions = instance.state.get('institutions') || {}

        users.forEach(userDoc => {
          const { institution } = userDoc
          if (!institution) {
            institutions[undefined] = (institutions[undefined] || [])
            institutions[undefined].push(userDoc)
          }
          else {
            if (!institutions[institution]) {
              institutions[institution] = []
            }

            institutions[institution].push(userDoc)
          }

          showInst[institution] = true
          instance.users.upsert({ _id: userDoc._id }, { $set: { ...userDoc } })
        })

        const loadUsersComplete = true
        instance.state.set({ institutions, showInst, loadUsersComplete })
      }
    })
  }

  instance.autorun(function () {
    const updated = instance.state.get('updatedUsers')

    if (updated) {
      return instance.state.set('updatedUsers', false)
    }

    instance.loadUsers()
  })
})

Template.adminUsers.helpers({
  institutionNames () {
    const institutions = Template.getState('institutions')
    return Object.keys(institutions)
  },
  showInstitution (name) {
    const showInst = Template.getState('showInst')
    return showInst[name]
  },
  getUsers (institution) {
    return Template.instance().users.find({ institution }).fetch()
  },
  getUserEmail (user) {
    return user && user.emails ? user.emails[0].address : ''
  },
  isVerified (user) {
    return user && user.emails && user.emails[0].verified === true
  },
  getUserGroups (roles) {
    return roles && Object.keys(roles)
  },
  getUserRoles (roles, group) {
    return roles && roles[group]
  },
  isMe (userId) {
    return userId === Meteor.userId()
  },
  isOnline (presence) {
    return presence && presence.status === 'online'
  },
  loadUsersComplete () {
    return Template.instance().state.get('loadUsersComplete')
  },
  showCreateUser () {
    return Template.instance().state.get('createUser')
  },
  createUserSchema () {
    return createUserSchema
  },
  submitting (id) {
    return Template.getState('submitting') === id
  },
  rolesUpdating (id) {
    return Template.getState('rolesUpdating') === id
  },
  updateUserSchema (type) {
    return updateSchemas.get(type)
  },
  updateUser () {
    return Template.getState('updateUser')
  },
  previewUser () {
    return Template.getState('previewUser')
  }
})

Template.adminUsers.events({
  'click .admin-view-btn' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    const userDoc = templateInstance.users.findOne(target)
    const previewUser = JSON.stringify(userDoc || {}, null, 2)
    templateInstance.state.set({ previewUser })
    API.showModal('viewModal')
  },
  'click .toggle-inst' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    const showInst = templateInstance.state.get('showInst')
    showInst[target] = !showInst[target]
    templateInstance.state.set('showInst', showInst)
  },
  'click #toggleCreateUserButton' (event, templateInstance) {
    event.preventDefault()
    const createUser = templateInstance.state.get('createUser')
    templateInstance.state.set('createUser', !createUser)
  },
  'click .admin-re-invite' (event, templateInstance) {
    event.preventDefault()
    const userId = dataTarget(event, templateInstance)

    templateInstance.state.set('submitting', userId)
    Meteor.call(Admin.methods.reinvite.name, { userId }, (err, res) => {
      templateInstance.state.set('submitting', null)
      if (err) {
        return API.notify(err)
      }
      API.notify(true)
    })
  },
  'click .delete-user-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const targetUser = templateInstance.users.findOne({ _id: targetId })
    const text = 'admin.users.confirmDelete'
    const textOptions = { name: `${targetUser.firstName} ${targetUser.lastName} (${targetUser.emails[0].address})` }

    confirmDialog({ text, textOptions, codeRequired: true, type: 'danger' })
      .catch(API.notify)
      .then(result => {
        if (!result) return

        templateInstance.state.set('submitting', targetId)
        Meteor.call(Admin.methods.removeUser.name, { _id: targetId }, function (err, res) {
          templateInstance.state.set('submitting', null)
          if (err) {
            API.notify(err)
          }
          else {
            API.notify('admin.users.deleted')
            templateInstance.users.remove(targetId)
          }
        })
      })
  },
  'click .create-user-button' (event, templateInstance) {
    event.preventDefault()
    API.showModal('createUserModal')
  },
  'submit #createUserForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid(createUserSchema, 'createUserForm')
    if (!insertDoc) return

    templateInstance.state.set('submitting', 'createUserForm')
    Meteor.call(Admin.methods.createUser.name, insertDoc, (err, newUserId) => {
      templateInstance.state.set('submitting', null)
      if (err) {
        return API.notify(err)
      }
      API.notify(true)
      API.hideModal('createUserModal')
      templateInstance.loadUsers({ ids: [newUserId]})
    })
  },
  'hidden.bs.modal' () {
    formReset('createUserForm')
  },
  'click .admin-edit-btn' (event, templateInstance) {
    event.preventDefault()
    const type = 'role'
    const method = Admin.methods.updateRole.name
    const userId = dataTarget(event, templateInstance)
    const user = templateInstance.users.findOne(userId)
    const doc = { userId, role: user.role, group: user.institution }
    const updateUser = { type, method, doc }

    templateInstance.state.set({ updateUser })
    API.showModal('updateUserModal')
  },
  'submit #updateUserForm' (event, templateInstance) {
    event.preventDefault()
    const updateUser = templateInstance.state.get('updateUser')
    const schema = updateSchemas.get(updateUser.type)
    const insertDoc = formIsValid(schema, 'updateUserForm')
    if (!insertDoc) return

    templateInstance.state.set('submitting', 'updateUserForm')
    Meteor.call(updateUser.method, insertDoc, (err) => {
      templateInstance.state.set('submitting', null)
      if (err) {
        return API.notify(err)
      }
      API.notify(true)
      templateInstance.state.set('updatedUsers', true)
      API.hideModal('updateUserModal')
      templateInstance.loadUsers({ ids: [insertDoc.userId] })
    })
  }
})
