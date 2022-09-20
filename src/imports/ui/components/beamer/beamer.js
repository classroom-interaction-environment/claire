import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'
import './beamer.html'

Template.beamer.helpers({
  beamerIsActive () {
    return Beamer.status()
  }
})
