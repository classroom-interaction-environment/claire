import { Template } from 'meteor/templating'
import './fail.html'

Template.fail.helpers({
  title (err) {
    console.info(err)
    return err.error || err.message
  }
})
