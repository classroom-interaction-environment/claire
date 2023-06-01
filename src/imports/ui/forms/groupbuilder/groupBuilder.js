import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { GroupBuilder } from '../../../contexts/classroom/group/GroupBuilder'
import { Schema } from '../../../api/schema/Schema'
import { Group } from '../../../contexts/classroom/group/Group'
import { formIsValid } from '../../components/forms/formUtils'
import { editGroupSchema } from './api/editGroupSchema'
import { createGroupsSchema } from './api/createGroupSchema'
import { getUsersCollection } from '../../../api/utils/getUsersCollection'
import groupBuilderLanguage from './i18n/groupBuilderLanguage'
import './groupBuilder.html'

let settingsSchema
let groupsSchema

const views = {
  defineSettings: 'defineSettings',
  editGroups: 'editGroups'
}

const API = Template.groupBuilder.setDependencies({
  contexts: [Group],
  language: groupBuilderLanguage
})

Template.groupBuilder.onCreated(function () {
  const instance = this
  const { classDoc, phases, material } = instance.data
  const translate = API.translate
  const groupTitleDefault = translate('groupBuilder.defaultTitle')

  instance.builder = new GroupBuilder({ groupTitleDefault })
  instance.builder.setOptions({ users: classDoc?.students })
  instance.state.set('view', views.defineSettings)

  const schemaOptions = { phases, material, translate }
  settingsSchema = Schema.create(createGroupsSchema(schemaOptions))
})

Template.groupBuilder.helpers({
  view (name) {
    return Template.getState('view') === name
  },
  createGroupsSchema () {
    return settingsSchema
  },
  editGroupSchema () {
    return groupsSchema
  },
  hasUsers () {
    const { classDoc } = Template.currentData()
    return !!classDoc?.students?.length
  },
  doc () {
    return {
      ...Template.instance().builder,
      maxUsers: 1,
      maxGroups: 1
    }
  },
  groupsDoc () {
    const groups = Tracker.nonreactive(() => Template.instance().builder.getAllGroups())
    return { groups }
  },
  editGroup (index) {
    return Template.getState('editGroup') === index
  },
  groups () {
    return Template.instance().builder.getAllGroups()
  },
  groupDoc (index) {
    return Template.instance().builder.getGroup(index)
  },
  users () {
    const { classDoc } = Template.instance().data
    const users = classDoc?.students ?? []
    return getUsersCollection().find({ _id: { $in: users } }, { sort: { username: 1 } })
  },
  suggestions (users) {
    return [
      { users: 2, groups: 1 }
    ]
  },
  userHasBeenAssigned (userId) {
    return Template.instance().builder.userHasBeenAssigned(userId)
  }
})

Template.groupBuilder.events({
  'submit #createGroupsForm' (event, templateInstance) {
    event.preventDefault()
  },
  'click .grp-init-btn' (event, templateInstance) {
    event.preventDefault()

    const groupSettings = formIsValid(settingsSchema, 'createGroupsForm')
    if (!groupSettings) {
      return
    }

    const { builder } = templateInstance
    builder.setOptions(groupSettings)

    const type = event.currentTarget.getAttribute('data-target')
    const shuffle = type === 'auto'

    builder.createGroups({ shuffle })

    groupsSchema = Schema.create(editGroupSchema(builder, templateInstance.data))
    templateInstance.state.set({ view: views.editGroups, groupSettings })
  },
  'click .grp-back-btn' (event, templateInstance) {
    event.preventDefault()

    templateInstance.builder.resetGroups()
    templateInstance.state.set('view', views.defineSettings)
  },
  'submit #editGroupsForm' (event, templateInstance) {
    event.preventDefault()
    const groupsDoc = formIsValid(groupsSchema, 'editGroupsForm')
    if (!groupsDoc) return API.log('group schema invalid')

    const groupSettings = templateInstance.state.get('groupSettings')
    templateInstance.data.onCreated({ groupSettings, groupsDoc })
  }
})
