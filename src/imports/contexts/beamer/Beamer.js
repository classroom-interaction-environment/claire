import { Beamer } from './BeamerCommon'
import { onClientExec } from '../../api/utils/archUtils'
import { callMethod } from '../../ui/controllers/document/callMethod'
import { getCollection } from '../../api/utils/getCollection'

onClientExec(function () {
  import { check, Match } from 'meteor/check'
  import { ReactiveVar } from 'meteor/reactive-var'
  import { openWindow } from '../../ui/utils/browser/windowUtils'
  const beamerReady = new ReactiveVar(false)
  const windowRef = new ReactiveVar(null)
  const windowIdStore = new ReactiveVar(null)
  const windowUrlStore = new ReactiveVar(null)
  let timerId

  const fallbackCallback = (err) => {
    if (err) {
      console.error(err)
    }
  }

  const clearTimer = () => {
    window.clearInterval(timerId)
    timerId = undefined
  }

  const initTimer = (windowRef) => {
    if (timerId) clearTimer()

    const checkChild = () => {
      if (windowRef.closed) {
        clearTimer()
        Beamer.actions.unload()
      }
    }
    timerId = setInterval(checkChild, 500)
  }

  const getMaterialIndex = ({ beamerDoc, lessonId, referenceId, context, itemId }) => {
    const references = beamerDoc.references || []
    const byMaterialProps = el => {
      if (el.lessonId !== lessonId) {
        return false
      }
      if (el.referenceId !== referenceId) {
        return false
      }
      if (typeof context === 'string' && el.context !== context) {
        return false
      }
      if (typeof itemId === 'string' && itemId.length > 0) {
        return el.itemId === itemId
      }
      return true
    }

    return references.findIndex(byMaterialProps)
  }

  Beamer.status = () => windowRef.get()

  Beamer.doc = {}

  /**
   * Get the Beamer document
   * @return {*}
   */
  Beamer.doc.get = () => getCollection(Beamer.name).findOne()

  /**
   * Get or set the Beamer ready state (reactive)
   * @param value
   * @return {*}
   */
  Beamer.doc.ready = (value) => {
    if (typeof value === 'undefined') {
      return beamerReady.get()
    }
    else {
      return beamerReady.set(Boolean(value))
    }
  }

  /**
   * Create a new Beamer document if none exists
   * @return {Promise<*>}
   */
  Beamer.doc.create = async () => {
    return callMethod({
      name: Beamer.methods.insert,
      args: {}
    })
  }

  /**
   * Update the Beamer document
   * @param doc {object}
   * @return {Promise<*>}
   */
  Beamer.doc.update = async (doc) => {
    doc._id = doc._id || Beamer.doc.get()._id
    return callMethod({
      name: Beamer.methods.update.name,
      args: doc
    })
  }

  /**
   * Check if the current window is the beamer window
   * @return {boolean}
   */
  Beamer.doc.isBeamerWindow = () => {
    const beamerDoc = Beamer.doc.get()
    if (!beamerDoc || !beamerDoc.window) {
      return false
    }

    const windowId = beamerDoc.window.id
    return windowId === window.name
  }

  /**
   * Get or set the background color of the beamer
   * @param value
   * @param callback
   * @async
   * @return {*|{nav: string, className: string, label: string, text: string, value: string}}
   */
  Beamer.doc.background = async (value, callback) => {
    const currentBeamerDoc = Beamer.doc.get()

    // returns a default if no doc exists yet
    // in order to support immediate bg rendering
    if (!currentBeamerDoc) {
      return Beamer.ui.backgroundColors.light
    }

    // on no value just return the current value
    if (!value) {
      const currentBackground = currentBeamerDoc.ui.background
      return Beamer.ui.backgroundColors[currentBackground]
    }

    // check color before updateing
    if (!Beamer.ui.backgroundColors[value]) {
      // todo make error translated, pass to callback
      throw new Error(`Expected correct background color, got ${value}`)
    }

    // otherwise we update the beamer doc with the new value
    const updateDoc = {
      _id: currentBeamerDoc._id,
      ui: {
        background: value,
        grid: (currentBeamerDoc.ui.grid || Beamer.defaultGridlayout)
      }
    }
    const res = await Beamer.doc.update(updateDoc)
    if (!res) {
      throw new Error('errors.docNotUpdated')
    }
    const beamerDoc = Beamer.doc.get()
    return beamerDoc.ui.background
  }

  Beamer.doc.grid = async (value, callback) => {
    const currentBeamerDoc = Beamer.doc.get()

    // returns a default if no doc exists yet
    // in order to support immediate bg rendering
    if (!currentBeamerDoc) {
      return Beamer.ui.gridLayouts.rows
    }

    // on no value just return the current value
    if (!value) {
      const currentLayout = currentBeamerDoc.ui.grid
      return Beamer.ui.gridLayouts[currentLayout]
    }

    // check value before updateing
    if (!Beamer.ui.gridLayouts[value]) {
      // todo make error translated, pass to callback
      throw new Error(`Expected correct grid layout, got ${value}`)
    }

    // otherwise we update the beamer doc with the new value
    const updateDoc = {
      _id: currentBeamerDoc._id,
      ui: {
        grid: value,
        background: (currentBeamerDoc.ui.background || Beamer.defaultBackground)
      }
    }
    const res = await Beamer.doc.update(updateDoc)
    if (!res) {
      throw new Error('errors.docNotUpdated')
    }
    const beamerDoc = Beamer.doc.get()
    return beamerDoc.ui.grid
  }

  Beamer.doc.code = (invitationCode, callback) => {
    if (typeof invitationCode === 'undefined') {
      const doc = Beamer.doc.get()
      return doc && doc.invitationCode
    }
    else {
      Beamer.doc.update({ invitationCode }, callback)
    }
  }

  Beamer.doc.material = ({ lessonId, referenceId, context, itemId, responseProcessor }, callback) => {
    check(lessonId, String)
    check(referenceId, String)
    check(context, String)
    check(itemId, Match.Maybe(String))
    check(responseProcessor, Match.Maybe(String))

    const beamerDoc = Beamer.doc.get()
    const references = beamerDoc.references || []
    const findIndex = getMaterialIndex({ beamerDoc, lessonId, referenceId, context, itemId })

    if (findIndex > -1) {
      references.splice(findIndex, 1)
    }
    else {
      references.push({ lessonId, referenceId, context, itemId, responseProcessor })
    }
    beamerDoc.references = references
    return Beamer.doc.update({ _id: beamerDoc._id, references }, callback)
  }

  Beamer.doc.has = ({ lessonId, referenceId, itemId, context }) => {
    const beamerDoc = Beamer.doc.get()
    const references = beamerDoc.references || []
    const findIndex = getMaterialIndex({ beamerDoc, lessonId, referenceId, itemId, context })

    if (findIndex > -1) {
      return references[findIndex]
    }
    else {
      return null
    }
  }

  /**
   * CLient side actions to interact with the beamer
   * @type {object}
   */
  Beamer.actions = {
    debug (value) {
    },
    init (beamerLocation, {
      windowId,
      width,
      height,
      left,
      top,
      menubar = false,
      status = false,
      titlebar = false
    } = {}) {
      check(beamerLocation, String)

      // beamerLocation could be for example Routes.present.path()
      const opened = Beamer.actions.open(beamerLocation, {
        windowId,
        width,
        height,
        left,
        top,
        menubar,
        status,
        titlebar
      })
      if (!opened || !opened.ref || !opened.id) {
        // todo pass error message as i18n id to callback
        console.warn('Could not open window. Maybe a policy prevents window from opening.')
        return { ref: undefined, id: undefined }
      }

      const { ref } = opened
      const { id } = opened

      windowRef.set(ref)
      initTimer(ref)
      windowIdStore.set(id)
      windowUrlStore.set(beamerLocation)
      Beamer.doc.update({ window: { id, url: beamerLocation } })
      return opened
    },
    restore () {
      const beamerDoc = Beamer.doc.get()
      if (!beamerDoc || !beamerDoc.window) {
        Beamer.actions.unload()
        return { ref: undefined, id: undefined }
      }

      const windowId = beamerDoc.window.id
      const windowUrl = beamerDoc.window.url

      if (!windowId || !windowUrl || windowId === global.window.name) {
        Beamer.actions.unload()
        return { ref: undefined, id: undefined }
      }

      return Beamer.actions.init(windowUrl, { windowId })
    },
    open: openWindow,
    unload (callback = fallbackCallback) {
      if (timerId) clearTimer()
      const existingWindow = windowRef.get()
      if (existingWindow && !existingWindow.closed) {
        // Firefox 46.0.1: scripts can not close windows, they had not opened
        existingWindow.close()
        if (!existingWindow.closed) {
          callback(new Error('beamer.errors.expectedWindowClose'))
        }
      }

      const windowId = windowIdStore.get()
      windowRef.set(null)
      windowUrlStore.set(null)
      windowIdStore.set(null)
      if (windowId && windowId !== global.window.name) {
        Beamer.doc.update({ window: { id: null, url: null } }, callback)
      }
      else {
        callback(null, true)
      }
    },
    key () {
      return windowIdStore.get()
    },
    url () {
      return windowUrlStore.get()
    },
    timerId () {
      return timerId
    },
    get () {
      return windowRef.get()
    }
  }
})

export { Beamer }