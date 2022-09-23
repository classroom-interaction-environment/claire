import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { SchoolClass } from '../../../../contexts/classroom/schoolclass/SchoolClass'
import { dataTarget } from '../../../utils/dataTarget'
import { confirmDialog } from '../../../components/confirm/confirm'
import '../../../components/profileImage/profileImage'
import '../../../generic/icon/icon'
import './userListrenderer.html'

const API = Template.userListRenderer.setDependencies({
  contexts: [SchoolClass]
})

Template.userListRenderer.helpers({
  isCurrentUser (userId) {
    return userId === Meteor.userId()
  },
  removing (userId) {
    return Template.getState('removing') === userId
  }
})

Template.userListRenderer.events({
  'click .remove-student-button' (event, templateInstance) {
    event.preventDefault()
    const classDoc = templateInstance.data.classDoc
    const classId = classDoc._id
    const users = templateInstance.data.users ?? []
    const studentId = dataTarget(event, templateInstance)
    const user = users.find(entry => entry._id === studentId)
    const text = 'lesson.actions.confirmRemoveStudent'
    const textOptions = {
      firstName: user.firstName,
      lastName: user.lastName,
      title: classDoc.title
    }

    const dialogOptions = { text, textOptions, codeRequired: true, type: 'danger' }
    confirmDialog(dialogOptions)
      .then(result => {
        if (!result) return

        templateInstance.state.set('removing', studentId)
        Meteor.call(SchoolClass.methods.removeStudent.name, {
          classId,
          userId: studentId
        }, (err, res) => {
          templateInstance.state.set('removing', null)
          if (err) {
            return API.notify(err)
          }

          return API.notify(!!res)
        })
      })
  }
})
