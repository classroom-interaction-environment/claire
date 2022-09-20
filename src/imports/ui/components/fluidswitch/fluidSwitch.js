import { Template } from 'meteor/templating'
import { Meteor } from 'meteor/meteor'
import { Users } from '../../../contexts/system/accounts/users/User'
import { Notify } from '../notifications/Notify'
import './fluidSwitch.html'

Template.fluidSwitch.events({
  'click .toggle-container-fluid' (event, templateInstance) {
    const user = Meteor.user()
    if (!user) {
      return Notify.add(new Error('user.notLoggedIn'))
    }
    const fluid = user.ui && user.ui.fluid
    Meteor.call(Users.methods.updateUI.name, { fluid: !fluid }, (err) => {
      if (err) {
        Notify.add(err)
      }
    })
  }
})
