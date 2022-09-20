import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { SubsManager } from '../../subscriptions/SubsManager'
import { dataTarget } from '../../utils/dataTarget'
import '../../components/color/selector/colorSelector'
import '../../generic/print/print'
import './navBeamer.css'
import './navBeamer.html'

const colorValues = Object.values(Beamer.ui.backgroundColors)
const gridLayouts = Object.values(Beamer.ui.gridLayouts)

Template.navBeamer.onCreated(function onCreated () {
  const instance = this

  instance.autorun(() => {
    if (!Meteor.userId()) return
    const beamerSub = SubsManager.subscribe(Beamer.publications.my.name)
    if (beamerSub.ready()) {
      const beamerDoc = Beamer.doc.get()
      instance.state.set('beamerDoc', beamerDoc)
    }
  })
})

Template.navBeamer.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('beamerDoc')
  },
  active () {

  },
  beamerColors () {
    return colorValues
  },
  gridLayouts () {
    return gridLayouts
  },
  background () {
    return Beamer.doc.background()
  },
  onModal (type) {
    return Template.instance().state.get('onModal') === type
  },
  isCurrentLayout (value) {
    const instance = Template.instance()
    const beamerDoc = instance.state.get('beamerDoc')
    return beamerDoc && beamerDoc.ui && beamerDoc.ui.grid === value
  }
})

Template.navBeamer.events({
  'click .modal-select-button' (event, templateInstance) {
    event.preventDefault()
    const type = dataTarget(event, templateInstance, 'type')
    templateInstance.state.set('onModal', type)
    templateInstance.$('#beamer-select-modal').modal('show')
  },
  'click .color-selector-target' (event, templateInstance) {
    event.preventDefault()
    const background = dataTarget(event, templateInstance)
    Beamer.doc.background(background, (err /*, res */) => {
      if (err) return API.notify(err)
    })
  },
  'click .grid-selector-target' (event, templateInstance) {
    event.preventDefault()
    const value = dataTarget(event, templateInstance, 'value')
    Beamer.doc.grid(value, (err /*, res */) => {
      if (err) return API.notify(err)
    })
  }
})
