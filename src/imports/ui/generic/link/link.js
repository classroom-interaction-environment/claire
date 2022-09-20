import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { toolTipEvents } from '../utils/tooltipUtils'
import './link.html'

Template.link.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()

  instance.autorun(() => {
    const data = Template.currentData()
    const href = data.href || ''
    const title = data.title
    const id = data.id

    let type
    if (data.submit || data.form) type = 'submit'
    if (data.button) type = 'button'

    const target = data.target
    const form = data.form
    const dataToggle = data.tooltip === false ? undefined : data.title && 'tooltip'
    const dataTrigger = data.title && 'manual'
    const disabled = data.disabled
    const disabledClass = disabled ? 'disabled' : ''
    const defaultClass = !data.label && (data.title || data.tooltip) ? 'caro-link' : ''
    const active = data.active ? 'active' : ''
    const btnClass = data.type ? `btn btn-${data.type}` : ''
    const customClass = data.class || ''
    const linkClass = `${defaultClass} ${btnClass} ${active} ${customClass} ${disabledClass}`

    // these are the main component attributes
    const attributes = {
      href,
      title,
      id,
      type,
      form,
      disabled,
      class: linkClass,
      'data-toggle': dataToggle,
      'data-trigger': dataTrigger
    }

    if (target) {
      attributes.target = target
    }

    // parse additional custom data-* and aria-* attributes
    Object.keys(data).forEach(key => {
      if (key.indexOf('data-') > -1) {
        attributes[key] = data[key]
      }
      if (key.indexOf('aria-') > -1) {
        attributes[key] = data[key]
      }
    })

    instance.state.set('attributes', attributes)
  })
})

Template.link.helpers({
  attributes () {
    return Template.instance().state.get('attributes')
  }
})

Template.link.events(toolTipEvents({ name: '.caro-link' }))
