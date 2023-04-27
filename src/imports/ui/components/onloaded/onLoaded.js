import { Template } from 'meteor/templating'
import './onLoaded.html'

Template.onLoaded.helpers({
  displayLoading () {
    return Template.instance().data.showLoading !== false
  }
})
