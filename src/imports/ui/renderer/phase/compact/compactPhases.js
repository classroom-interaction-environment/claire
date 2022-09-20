import { Template } from 'meteor/templating'
import { resolveMaterialReference } from '../../../../contexts/material/resolveMaterialReference'
import '../../../generic/tooltip/tooltip'
import './compactPhases.html'

const byCollection = (a, b) => a.collection.localeCompare(b.collection)

Template.phasesCompact.helpers({
  references (refList = []) {
    return refList && refList
      .sort(byCollection)
      .map(refObj => resolveMaterialReference(refObj))
  }
})

Template.phasesCompact.events({
  'click .pc-toggle-btn' (event, templateInstance) {
    event.preventDefault()

    // TODO implement internal toggle functionality
  }
})
