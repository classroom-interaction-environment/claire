import { Template } from 'meteor/templating'
import './codeView.html'

Template.uecodeView.helpers({
  docs () {
    return Object.entries(Template.instance().data).map(([title, doc]) => ({ title, doc }))
  }
})
