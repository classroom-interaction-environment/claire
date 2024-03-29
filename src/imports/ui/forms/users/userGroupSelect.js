import { Template } from 'meteor/templating'
import { Group } from '../../../contexts/classroom/group/Group'
import { Schema } from '../../../api/schema/Schema'
import { dataTarget } from '../../utils/dataTarget'
import { formIsValid } from '../../components/forms/formUtils'
import { getUser } from '../../../contexts/system/accounts/users/getUser'
import './autoform'
import './userGroupSelect.scss'
import './userGroupSelect.html'

Template.afUserGroupSelect.setDependencies()

Template.afUserGroupSelect.onCreated(function () {
  const instance = this
  const isUpdate = instance.data.value === ''
  instance.state.set('selectedUsers', [])
  instance.state.set('isUpdate', isUpdate)
  // const { minCount, maxCount } = instance.data
  const { builder, allMaterial } = instance.data.atts
  const { users = [], roles = [], material = [], maxUsers, materialForAllGroups } = builder
  const materialOptions = (allMaterial || []).filter(({ value }) => material.includes(value))

  /**
   * @type GroupBuilder
   */
  instance.builder = builder
  instance.state.set({ roles, maxUsers, materialOptions, materialForAllGroups })

  // on internal changes
  instance.autorun(() => {
    instance.state.set('editTitle', false)
    const groups = builder.groups.get()
    const assignedUsers = new Set()

    groups.forEach((group, i) => {
      (group.users || []).forEach(user => assignedUsers.add(user.userId))
    })

    const resolvedUsers = getUsers({ users, assignedUsers })
    instance.state.set({ users: resolvedUsers, hasUsers: resolvedUsers.length > 0 })
  })
})

const getUsers = ({ users, assignedUsers }) => {
  return users
    .map(getUser)
    .filter(userDoc => userDoc && !assignedUsers.has(userDoc._id))
    .sort((a, b) => (b.presence?.status === 'online' ? 1 : 0) - (a.presence?.status === 'online' ? 1 : 0))
}

const titleSchema = Schema.create({
  title: {
    ...Group.schema.title,
    autoform: {
      label: false,
      afFieldInput: {
        autofocus: ''
      }
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
  hasUsers () {
    return Template.getState('hasUsers')
  },
  maxUsers () {
    return Template.getState('maxUsers')
  },
  canAddGroups () {
    return !Template.getState('isUpdate')
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
    if (!group) {
      return null
    }
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
    templateInstance.builder.removeGroup(index)
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
    const isDraggable = event.relatedTarget && event.relatedTarget.getAttribute('draggable')

    if (isDraggable) {
      overDraggable = true
    }

    templateInstance.state.set('dragOverIndex', { index, role })
  },
  'dragleave .user-dropzone' (event, templateInstance) {
    if (overDraggable) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      overDraggable = false
      return false
    }
    templateInstance.state.set('dragOverIndex', null)
  },
  'drop .user-dropzone' (event, templateInstance) {
    event.preventDefault()
    // the user id
    const userId = event.originalEvent.dataTransfer.getData('application/groupBuilder-userId')

    // index of the group the user came from
    // if -1 the user is "new" and came from no group
    const fromGroupIndexStr = event.originalEvent.dataTransfer.getData('application/groupBuilder-groupIndex')
    const fromGroupIndex = fromGroupIndexStr ? Number.parseInt(fromGroupIndexStr, 10) : -1

    // index of the group, where the user is dropped
    const index = Number.parseInt(dataTarget(event, templateInstance, 'index'), 10)

    // if the users is dropped on their current group
    // skip here as there is nothing to update
    if (index === fromGroupIndex) {
      return templateInstance.state.set('dragOverIndex', null)
    }

    // role is only defined if roles exist and user is dropped on a role' dropzone
    const roleStr = dataTarget(event, templateInstance, 'role')
    const role = roleStr === 'none' ? undefined : roleStr

    // if target index is -1 then we remove the users back to the user-pool
    if (index === -1) {
      templateInstance.builder.removeUser({ index: fromGroupIndex, userId, role })
    }

    // if this is an unselected user
    else if (fromGroupIndex === -1) {
      templateInstance.builder.addUser({ index, userId, role })
    }

    // if it's selected and it's just a new group
    else if (fromGroupIndex === index) {
      templateInstance.builder.updateUser({ index, userId, role })
    }

    // or it's a switch to another group
    else {
      templateInstance.builder.addUser({ index, userId, role })
      templateInstance.builder.removeUser({ index: fromGroupIndex, userId, role })
    }

    templateInstance.state.set('dragOverIndex', null)
    updateInput(templateInstance)
  }
})

let overDraggable = false

function updateInput (templateInstance) {
  const groups = templateInstance.builder.groups.get()
  templateInstance.$('input').val(JSON.stringify(groups))
}
