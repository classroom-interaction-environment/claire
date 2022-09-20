/* global $ */
import { Template } from 'meteor/templating'
import './richtext.html'

Template.textRendererrt.helpers({
  clean (rt) {
    const $rt = $(rt)
    const { print } = Template.instance().data
    if (!print) {
      $rt.find('img').each(function (index, img) {
        const image = $(img)
        const src = image.attr('src')
        image
          .addClass('img-fluid')
          .addClass('lozad')
          .removeAttr('width')
          .removeAttr('height')
          .attr('data-src', src)
          .removeAttr('src')
      })
    }
    const appendedHtml = $('<div>').append($rt).html()
    // console.log(appendedHtml)
    return appendedHtml
  }
})
