import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Group } from '../../../contexts/classroom/group/Group'
import { Schema } from '../../../api/schema/Schema'
import { dataTarget } from '../../utils/dataTarget'
import { formIsValid } from '../../components/forms/formUtils'
import './autoform'
import './userGroupSelect.scss'
import './userGroupSelect.html'

Template.afUserGroupSelect.setDependencies()

Template.afUserGroupSelect.onCreated(function () {
  const instance = this
  instance.state.set('selectedUsers', [])

  // const { minCount, maxCount } = instance.data
  const { builder, allMaterial } = instance.data.atts
  const { users = [], roles = [], material = [], maxUsers, materialForAllGroups } = builder
  const materialOptions = (allMaterial || []).filter(({ value }) => material.includes(value))
  instance.builder = builder

  const query = { _id: { $in: users } }
  const transform = {
    sort: { lastName: 1, firstName: 1 }
  }

  instance.state.set({ roles, maxUsers, materialOptions, materialForAllGroups })

  // on internal changes
  instance.autorun(() => {
    instance.state.set('editTitle', false)
    const groups = builder.groups.get()
    const assignedUsers = new Set()

    groups.forEach((group, i) => {
      (group.users || []).forEach(user => assignedUsers.add(user.userId))
    })

    const users = Meteor.users
      .find(query, transform)
      .fetch()
      .filter(userDoc => !assignedUsers.has(userDoc._id))
      .sort((a, b) => (b.presence?.status === 'online' ? 1 : 0) - (a.presence?.status === 'online' ? 1 : 0))

    instance.state.set({ users })
  })
})

const titleSchema = Schema.create({
  title: {
    ...Group.schema.title,
    autoform: {
      label: false
    }
  }
})

Template.afUserGroupSelect.onRendered(function () {
  const instance = this
  updateInput(instance)
})

Template.afUserGroupSelect.helpers({
  editTitle (index) {
    return Template.getState('editTitle') === index
  },
  titleSchema () {
    return titleSchema
  },
  allUsers () {
    return Template.getState('users')
  },
  maxUsers () {
    return Template.getState('maxUsers')
  },
  canAddGroups () {
    const { builder } = Template.instance()
    return builder && !builder.hasMaxGroups()
  },
  materialForAllGroups () {
    return Template.getState('materialForAllGroups')
  },
  materialOptions () {
    return Template.getState('materialOptions')
  },
  addedMaterials (groupIndex) {
    const { builder } = Template.instance()
    const group = builder.getGroup(groupIndex)
    const material = group.material ?? []
    const options = Template.getState('materialOptions') ?? []
    return options.filter(({ value }) => material.includes(value))
  },
  materialsToAdd (groupIndex) {
    const { builder } = Template.instance()
    const group = builder.getGroup(groupIndex)
    const material = group.material ?? []
    const options = Template.getState('materialOptions') ?? []
    return options.filter(({ value }) => !material.includes(value))
  },
  inputAtts () {
    const { builder, allMaterial, ...atts } = Template.currentData().atts
    return atts
  },
  roles () {
    return Template.getState('roles')
  },
  allGroups () {
    const { builder } = Template.instance()
    return builder && builder.groups.get()
  },
  isOver (index, role) {
    const dragOverIndex = Template.getState('dragOverIndex')
    if (!dragOverIndex) {
      return false
    }
    return dragOverIndex.index === index && dragOverIndex.role === role
  },
  roleUsers (users, role) {
    return users.filter(usr => usr.role === role)
  },
  addGroupsDisabled () {
    const users = Template.getState('users')
    return !users || users.length === 0
  },
  removeDisabled () {
    const { builder } = Template.instance()
    return builder && builder.groups.get().length < 2
  }
})

Template.afUserGroupSelect.events({
  'click .add-group-btn' (event, templateInstance) {
    event.preventDefault()
    const size = templateInstance.builder.groups.get().length
    const title = `${templateInstance.builder.groupTitleDefault} ${size + 1}`
    templateInstance.builder.addGroup({ title })
    updateInput(templateInstance)
  },
  'click .material-toggle' (event, templateInstance) {
    event.preventDefault()

    const materialId = dataTarget(event, templateInstance)
    const index = Number.parseInt(dataTarget(event, templateInstance, 'index'), 10)
    const action = dataTarget(event, templateInstance, 'action')

    if (action === 'add') {
      templateInstance.builder.addMaterial({ index, materialId })
    }

    if (action === 'remove') {
      templateInstance.builder.removeMaterial({ index, materialId })
    }
    updateInput(templateInstance)
  },
  'click .edit-title-btn' (event, templateInstance) {
    event.preventDefault()
    const editTitle = Number.parseInt(dataTarget(event, templateInstance), 10)
    templateInstance.state.set({ editTitle })
  },
  'submit #editGroupTitleForm' (event, templateInstance) {
    event.preventDefault()
    const index = templateInstance.state.get('editTitle')
    const insertDoc = formIsValid(titleSchema, 'editGroupTitleForm')
    if (!insertDoc) {
      return
    }
    const { title } = insertDoc
    templateInstance.builder.updateGroup({ index, title })
    updateInput(templateInstance)
  },
  'click .remove-group-btn' (event, templateInstance) {
    event.preventDefault()
    const index = Number.parseInt(dataTarget(event, templateInstance), 10)
    templateInstance.builder.removeGroup({ index })
    updateInput(templateInstance)
  },
  'dragstart .user-element' (event, templateInstance) {
    const userId = dataTarget(event, templateInstance)
    const groupIndex = dataTarget(event, templateInstance, 'index')
    event.originalEvent.dataTransfer.setData('application/groupBuilder-userId', userId)
    event.originalEvent.dataTransfer.setData('application/groupBuilder-groupIndex', groupIndex || '')
    event.originalEvent.dataTransfer.effectAllowed = 'move'
  },
  'dragenter .user-dropzone' (event, templateInstance) {
    const index = Number.parseInt(dataTarget(event, templateInstance, 'index'), 10)
    const role = dataTarget(event, templateInstance, 'role') || undefined
    templateInstance.state.set('dragOverIndex', { index, role })
  },
  'dragleave .user-dropzone' (event, templateInstance) {
    templateInstance.state.set('dragOverIndex', null)
  },
  'drop .user-dropzone' (event, templateInstance) {
    event.preventDefault()
    // the user id
    const userId = event.originalEvent.dataTransfer.getData('application/groupBuilder-userId')

    // index of the group the user came from
    // if -1 the user is "new" and came from no group
    const groupIndexStr = event.originalEvent.dataTransfer.getData('application/groupBuilder-groupIndex')
    const groupIndex = groupIndexStr ? Number.parseInt(groupIndexStr, 10) : -1

    // index of the group, where the user is dropped
    const index = Number.parseInt(dataTarget(event, templateInstance, 'index'), 10)

    // role is only defined if roles exist and user is dropped on a role' dropzone
    const roleStr = dataTarget(event, templateInstance, 'role')
    const role = roleStr === 'none' ? undefined : roleStr

    // if this is an unselected user
    if (groupIndex === -1) {
      templateInstance.builder.addUser({ index, userId, role })
    }

    // if it's selected and it's just a new group
    else if (groupIndex === index) {
      templateInstance.builder.updateUser({ index, userId, role })
    }

    // or it's a switch to another group
    else {
      templateInstance.builder.addUser({ index, userId, role })
      templateInstance.builder.removeUser({ index: groupIndex, userId, role })
    }
    templateInstance.state.set('dragOverIndex', null)
    updateInput(templateInstance)
  }
})

function updateInput (templateInstance) {
  const groups = templateInstance.builder.groups.get()
  templateInstance.$('input').val(JSON.stringify(groups))
}
