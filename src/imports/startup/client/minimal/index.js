import './defaults'
import './serviceWorker'
import './navigator'
import './bootstrap'
import './accounts'
import './forms'
import './helpers'
import './templates'
import './settings'
import './language'

// defer to later load
setTimeout(async () => {
  await import('./logos')
  await import('./fontawesome')
}, 50)

const globalDragDropHandler = function (e) {
  e.preventDefault()
}

// global browser handlers
window.addEventListener('dragover', globalDragDropHandler, false)
window.addEventListener('drop', globalDragDropHandler, false)
