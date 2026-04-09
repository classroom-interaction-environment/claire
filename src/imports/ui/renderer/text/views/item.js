import { Template } from 'meteor/templating'
import './item.html'
import { Notify } from '../../../components/notifications/Notify'

Template.textRendereritem.onCreated(function () {

  this.autorun(() => {
    const data = Template.currentData()
    if (data.onItemLoad) {
      data.onItemLoad(data.refId, (err, answer) => {
        if (err) {
          return Notify.error(err)
        }
        this.state.set({ answer: answer[data.refId] })
      }, 0)
    }
  })
})

Template.textRendereritem.helpers({
  answer () {
    return Template.getState('answer')
  }
})
