import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Task } from '../../Task'
import { userIsCurriculum } from '../../../../../../api/accounts/userIsCurriculum'
import { isCurriculumDoc } from '../../../../../../api/decorators/methods/isCurriculumDoc'
import { dataTarget } from '../../../../../../ui/utils/dataTarget'
import { renderPreview } from '../../../../../../ui/renderer/renderPreview'
import { printHTMLElement } from '../../../../../../ui/utils/printHtmlElement'
import './taskListRenderer.html'

Template.taskListRenderer.setDependencies()

Template.taskListRenderer.helpers({
  pages (arr) {
    if (!arr || arr.length === 0) {
      return { noPages: true }
    }
    else {
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

Template.taskListRenderer.events({
  'click .preview-btn' (event, templateInstance) {
    event.preventDefault()
    const docId = dataTarget(event, templateInstance)
    const context = Task.name
    templateInstance.data.parent.state.set({ previewTarget: docId, isPrintPreview: true })

    setTimeout(() => {
      const target = document.querySelector('#uematerial-preview-modal-body')
      const onClose = () => templateInstance.data.parent.state.set({ previewTarget: null, isPrintPreview: false })
      const onError = () => renderPreview({ docId, context })
      printHTMLElement(target, onClose, onError)
    }, 1000)
  }
})
