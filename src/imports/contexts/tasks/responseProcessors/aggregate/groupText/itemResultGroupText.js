import { Template } from 'meteor/templating'
import '../../../../../ui/generic/nodocs/nodocs'
import { withProperty } from '../../../../../api/utils/object/withProperty'
import responseLanguage from '../../i18n/responseLanguage'
import './itemResultGroupText.html'
import { Group } from '../../../../classroom/group/Group'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'

const ensureArray = (target, name) => {
  withProperty(target, name, [])
  return target[name]
}

const API = Template.itemResultGroupText.setDependencies({
  contexts: [Group],
  language: responseLanguage
})

Template.itemResultGroupText.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()

    const groups = {}
    let hasGroups = false

    const groupIds = new Set()

    data.results.forEach(resultDoc => {
      if (resultDoc.groupId) {
        groupIds.add(resultDoc.groupId)
        ensureArray(groups, resultDoc.groupId).push(resultDoc)
        hasGroups = true
      }
    })

    const groupResults = Object
      .entries(groups)
      .map(([groupId, docs]) => ({ groupId, docs }))

    instance.state.set({
      groupResults,
      hasGroups,
      loadComplete: true
    })

    loadIntoCollection({
      name: Group.methods.get,
      args: { ids: [...groupIds] },
      failure: API.notify,
      collection: getLocalCollection(Group.name)
    })
  })
})

Template.itemResultGroupText.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  },
  hasGroups () {
    return Template.getState('hasGroups')
  },
  groupResults () {
    return Template.getState('groupResults')
  },
  groupDoc (groupId) {
    return getLocalCollection(Group.name).findOne(groupId)
  }
})
