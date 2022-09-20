import { Template } from 'meteor/templating'
import lozad from 'lozad'
import './image.html'

const imageClass = 'caro-image'

Template.image.helpers({
  attributes () {
    const instance = Template.instance()
    const { data } = instance
    const customClasses = data.class || ''
    const fluid = data.fluid ? 'img-fluid' : ''
    const classes = `${imageClass} ${fluid} ${customClasses}`

    return {
      title: data.title,
      alt: data.alt,
      'aria-title': data.title,
      width: data.width,
      height: data.height,
      class: classes,
      'data-src': data.src
    }
  }
})

Template.image.onRendered(function () {
  const instance = this
  const $image = instance.$(`.${imageClass}`)
  const image = $image.get(0)

  if (!image) {
    return
  }

  const observer = lozad(image)
  observer.observe()
})
