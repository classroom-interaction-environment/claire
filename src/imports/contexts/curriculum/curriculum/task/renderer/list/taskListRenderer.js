import { Template } from 'meteor/templating'
import { userIsCurriculum } from '../../../../../../api/accounts/userIsCurriculum'
import { isCurriculumDoc } from '../../../../../../api/decorators/methods/isCurriculumDoc'
import './taskListRenderer.html'

Template.taskListRenderer.helpers({
  pages (arr) {
    if (!arr || arr.length === 0) {
      return { noPages: true }
    } else {
      return { length: arr.length }
    }
  },
  emptyPages (arr = []) {
    let empty = 0
    arr.forEach(page => {
      if (!page.content || page.content.length === 0) {
        empty++
      }
    })
    return empty
  },
  copyRequired (taskDoc, userId = Meteor.userId()) {
    // there is a copy required in the following cases:
    // - taskDoc is a master copy
    // - and unitDoc is no master copy
    // - or the user is no curriculum editor

    if (!isCurriculumDoc(taskDoc)) {
      return false
    }

    const { unitDoc } = taskDoc
    return !isCurriculumDoc(unitDoc) || !userIsCurriculum(userId)
  }
})
