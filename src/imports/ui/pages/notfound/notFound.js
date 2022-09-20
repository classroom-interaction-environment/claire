import { Template } from 'meteor/templating'
import './notFound.html'

const API = Template.notFound.setDependencies()

Template.notFound.helpers({
  initComplete () {
    return API.initComplete()
  }
})
