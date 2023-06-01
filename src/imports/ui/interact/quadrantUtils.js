/* global $ */
import { Interact } from './Interact'

export const quadrantToDropzone = (quadrant) => {
  const quadrantName = quadrant.name
  const color = quadrant.color

  // enable draggables to be dropped into this
  Interact.get(`#dropzone-${quadrantName}`).dropzone({
    // only accept elements matching this CSS selector
    accept: '.draggable',
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    // listen for drop related events:

    ondropactivate (event) {
      // add active dropzone feedback
      event.target.classList.add('drop-active')
    },
    ondragenter (event) {
      const draggableElement = event.relatedTarget
      const dropzoneElement = event.target

      // feedback the possibility of a drop
      dropzoneElement.classList.add('drop-target')

      draggableElement.classList.add('can-drop')
      $(draggableElement).css('background-color', color)
    },
    ondragleave (event) {
      // remove the drop feedback style
      event.target.classList.remove('drop-target')

      const draggableElement = event.relatedTarget
      draggableElement.classList.remove('can-drop')
      $(draggableElement).css('background-color', '#d4d4d4')
    },
    ondrop (event) {
      // set new color
    },
    ondropdeactivate (event) {
      // remove active dropzone feedback
      event.target.classList.remove('drop-active')
      event.target.classList.remove('drop-target')
    }
  })
}

/** ******************************************************
 https://stackoverflow.com/a/5851625/3098783
 https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
 ******************************************************** */

const GoldenRatioGenerator = {
  rand (min, max) {
    return min + Math.random() * (max - min)
  },

  golden_ratio_conjugate: 0.618033988749895,

  h: null,
  s: 75,
  l: 85,

  color () {
    if (!this.h) this.h = this.rand(1, 360)
    this.h += (360 / this.golden_ratio_conjugate)
    return `hsl(${this.h},${this.s}%,${this.l}%)`
  }
}

/** ***************************************************** */

export const addQuadrant = function addQuadrant (templateInstance, _name, _color) {
  const input = templateInstance.$('#add-cluster-category-input')
  const value = _name || input.val().trim()
  input.val('')

  const quadrants = templateInstance.state.get('quadrants')
  if (quadrants.map(q => q.name).indexOf(value) > -1) {
    // TODO show err
    return
  }
  quadrants.push({ name: value, color: _color || GoldenRatioGenerator.color() })
  templateInstance.state.set('quadrants', quadrants)
}

// credits go to https://stackoverflow.com/a/2035211/3098783
export const getViewport = function getViewport () {
  let viewPortWidth
  let viewPortHeight

  if (typeof window.innerWidth !== 'undefined') {
    // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
    viewPortWidth = window.innerWidth
    viewPortHeight = window.innerHeight
  }
  else if (typeof document.documentElement !== 'undefined' &&
    typeof document.documentElement.clientWidth !== 'undefined' &&
    document.documentElement.clientWidth !== 0) {
    // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
    viewPortWidth = document.documentElement.clientWidth
    viewPortHeight = document.documentElement.clientHeight
  }
  else {
    // older versions of IE
    viewPortWidth = document.getElementsByTagName('body')[0].clientWidth
    viewPortHeight = document.getElementsByTagName('body')[0].clientHeight
  }
  return [viewPortWidth, viewPortHeight]
}
