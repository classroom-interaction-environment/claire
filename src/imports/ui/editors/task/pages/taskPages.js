import { Template } from 'meteor/templating'
import { Shared } from '../helpers/shared'
import { Task } from '../../../../contexts/curriculum/curriculum/task/Task'
import '../pagecontent/pageContent'
import './taskPages.html'

/*******************************************************************************
 * UPDATE DECEMBER 2025
 * This Template now acts only as a simple wrapper, beforehand there were pages
 * to be edited.
 * - pages are kept for backwards compatibility but will be handled as "single page"
 * - there is no more page navigation
 *******************************************************************************/

Template.taskPages.setDependencies({
  contexts: [Task]
})


Template.taskPages.onCreated(function () {
  const instance = this
  instance.state.set('currentIndex', 0)

  // bind fct
  Shared.updatePage = function (index, page) {
    instance.state.set('currentIndex', index)
    instance.state.set('currentPage', page)
  }

  instance.autorun(function () {
    const data = Template.currentData()
    const { taskDoc } = data

    if (!instance.state.get('currentPage')) {
      instance.state.set('currentPage', (taskDoc.pages && taskDoc.pages[0]) || {
        title: '',
        content: []
      })
    }

    instance.state.set('taskDoc', taskDoc)
    instance.state.set('pages', taskDoc.pages)
  })
})

Template.taskPages.helpers({
  currentPage () {
    return Template.getState('currentPage')
  },
  currentIndex () {
    return Template.getState('currentIndex')
  },
  task () {
    return Template.getState('taskDoc')
  },
})
