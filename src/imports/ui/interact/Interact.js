/* global $ */
import interact from 'interactjs'

export const Interact = {
  dragStartListener (event) {

  },
  dragMoveListener (event) {
    const { target } = event
    const targetx = parseFloat(target.getAttribute('data-x'))
    const targety = parseFloat(target.getAttribute('data-y'))
    Interact.transform(target, event.dx, event.dy, targetx, targety)
  },
  getOffset (targetValue, deltaValue, containerValue) {
    return (targetValue * deltaValue) / containerValue
  },
  transform (target, dx, dy, targetx, targety) {
    // keep the dragged position in the data-x/data-y attributes
    let x = (targetx || 0) + dx
    let y = (targety || 0) + dy

    if (x < 0) x = 0
    if (y < 0) y = 0

    // translate the element
    target.style.transform = `translate(${x}px, ${y}px)`
    target.style.webkitTransform = target.style.transform

    // update the posiion attributes
    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
  },

  getResiveMoveListener (selector) {
    return function resizeMoveListener (event) {
      // get scale of drop container
      // see http://stackoverflow.com/questions/5603615/get-the-scale-value-of-an-element
      const container = $(selector)[0]
      const scaleX = container.getBoundingClientRect().width / container.offsetWidth
      const scaleY = container.getBoundingClientRect().height / container.offsetHeight

      // apply transform
      const target = event.target
      let x = event.rect.width / scaleX
      let y = event.rect.height / scaleY

      //  get data-x offsets of container
      const offsetLeft = target.getAttribute('data-x')
      const offsetTop = target.getAttribute('data-y')

      x = this.checkBounds(offsetLeft, x, $(selector).width())
      y = this.checkBounds(offsetTop, y, $(selector).height())

      target.style.width = x + 'px'
      target.style.height = y + 'px'
    }
  },
  checkBounds (offset, dimension, limit) {
    offset = (parseFloat(offset) || 0)
    if (offset + dimension > limit) {
      // larger than container
      dimension = limit - offset
    }
    return dimension
  },
  dispose ({ target, templateInstance }) {
    const $target = templateInstance.$(target)
    $target.html(null)
  },
  init ({ restrictTarget, selector = '.draggable', onEnd, templateInstance }) {
    const resizeContainer = templateInstance.$(restrictTarget)

    let oldx = 0
    let oldy = 0
    let newx = 0
    let newy = 0
    let dx = 0
    let dy = 0
    let tx = 0
    let ty = 0
    let nx = 0
    let ny = 0

    function onResize (/* event */) {
      newx = resizeContainer.width()
      newy = resizeContainer.height()
      // get delta in percent
      dx = newx - oldx
      dy = newy - oldy

      $(selector).each((index, target) => {
        tx = parseFloat(target.getAttribute('data-x')) || 0
        ty = parseFloat(target.getAttribute('data-y')) || 0
        nx = Interact.getOffset(tx, dx, oldx)
        ny = Interact.getOffset(ty, dy, oldy)
        Interact.transform(target, nx, ny, tx, ty)
      })
      oldx = newx
      oldy = newy
    }

    if (restrictTarget && resizeContainer.get(0)) {
      oldx = resizeContainer.width()
      oldy = resizeContainer.height()
      window.removeEventListener('resize', onResize)
      window.addEventListener('resize', onResize)
    }

    interact(selector).draggable({

      inertia: false, // disable inertial throwing

      // keep the element within the area of it's parent
      restrict: {
        restriction: restrictTarget || 'parent',
        endOnly: false,
        elementRect: {
          top: 0, left: 0, bottom: 1, right: 1
        }
      },
      autoScroll: false, // disable autoScroll

      cursorChecker (action, interactable, element, interacting) {
        return interacting ? 'grabbing' : 'grab'
      },

      onstart: Interact.dragStartListener,

      // call this function on every dragmove event
      onmove: Interact.dragMoveListener,

      // call this function on every dragend event
      onend: onEnd
    })
  },
  get (selector) {
    return interact(selector)
  }
}
