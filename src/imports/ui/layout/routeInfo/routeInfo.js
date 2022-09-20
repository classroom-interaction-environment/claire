import { Template } from 'meteor/templating'
import { Router } from '../../../api/routes/Router'
import './routeInfo.html'

Template.routeInfo.helpers({
  routeTitle () {
    return Router.label()
  },
  ref () {
    const refEntry = Router.queryParam('ref')
    const refName = Router.queryParam('refName')
    if (refEntry) {
      return { value: decodeURIComponent(refEntry), label: decodeURIComponent(refName) }
    }
  }
})
