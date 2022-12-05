import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { ReactiveVar } from 'meteor/reactive-var'
import { UserUtils } from '../system/accounts/users/UserUtils'
import { getCollection } from '../../api/utils/getCollection'
import { onClientExec, onServer } from '../../api/utils/archUtils'
import { openWindow } from '../../ui/utils/browser/windowUtils'

const backgroundColors = {
  secondary: {
    value: 'secondary',
    label: 'colors.secondary',
    className: 'secondary',
    text: 'dark',
    nav: 'dark'
  },
  white: {
    value: 'white',
    label: 'colors.white',
    className: 'white',
    nav: 'light',
    text: 'dark'
  },
  light: {
    value: 'light',
    label: 'colors.light',
    className: 'light',
    nav: 'light',
    text: 'dark'
  },
  dark: {
    value: 'dark',
    label: 'colors.dark',
    className: 'dark',
    nav: 'dark',
    text: 'light'
  }
}

const gridLayouts = {
  rows: {
    value: 'rows',
    label: 'gridLayout.rows',
    rowClass: 'row w-100',
    colClass: 'col-12 w-100'
  },
  cols2: {
    value: 'cols2',
    label: 'gridLayout.cols2',
    rowClass: 'row',
    colClass: 'col-6'
  },
  cols3: {
    value: 'cols3',
    label: 'gridLayout.cols3',
    rowClass: 'row',
    colClass: 'col-4'
  },
  cols4: {
    value: 'cols4',
    label: 'gridLayout.cols4',
    rowClass: 'row',
    colClass: 'col-3'
  }
}

export const Beamer = {
  name: 'beamer',
  label: 'beamer.title',
  icon: 'tv',
  noDefaultSchema: true,
  isSystem: true,
  isClassroom: true,
  defaultBackground: backgroundColors.light.value,
  defaultGridlayout: gridLayouts.rows.value,
  ui: {
    backgroundColors,
    gridLayouts
  },
  methods: {},
  publications: {
    my: {
      name: 'beamer.publications.my',
      schema: {},
      run: onServer(function () {
        return getCollection(Beamer.name).find({ createdBy: this.userId }, { limit: 1 })
      })
    }
  },
  helpers: {},
  inject: {}
}

Beamer.schema = {
  createdBy: {
    type: String
  },
  invitationCode: {
    type: String,
    optional: true
  },
  references: {
    type: Array,
    label: 'beamer.references',
    optional: true
  },
  'references.$': {
    type: Object,
    label: 'common.entry'
  },
  'references.$.lessonId': {
    type: String,
    label: 'lesson.title'
  },
  'references.$.referenceId': {
    type: String,
    label: 'beamer.reference'
  },
  'references.$.context': {
    type: String,
    label: 'beamer.context'
  },
  'references.$.itemId': {
    type: String,
    optional: true
  },
  'references.$.responseProcessor': {
    type: String,
    optional: true
  },
  headline: {
    type: String,
    optional: true,
    label: 'beamer.headline'
  },
  instruction: {
    type: String,
    optional: true,
    label: 'beamer.instruction'
  },
  countDown: {
    type: Date,
    label: 'beamer.countDown',
    optional: true
  },
  hideOnCountdownEnd: {
    type: Boolean,
    label: 'beamer.hideOnCountdownEnd',
    optional: true
  },
  ui: {
    type: Object,
    optional: true
  },
  'ui.background': {
    type: String,
    optional: true,
    allowedValues: Object.keys(backgroundColors)
  },
  'ui.grid': {
    type: String,
    optional: true,
    allowedValues: Object.keys(gridLayouts)
  },
  window: {
    type: Object,
    optional: true
  },
  'window.id': {
    type: String,
    optional: true
  },
  'window.url': {
    type: String,
    optional: true
  }
}

Beamer.methods.insert = {
  name: 'beamer.methods.insert',
  schema: {},
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.teacher],
  numRequests: 1,
  timeInterval: 50000,
  run: onServer(function () {
    const BeamerCollection = getCollection(Beamer.name)

    if (BeamerCollection.findOne({ createdBy: this.userId })) {
      throw new Meteor.Error('errors.docAlreadyExists')
    }

    const ui = {
      background: Beamer.defaultBackground,
      grid: Beamer.defaultGridlayout
    }

    return BeamerCollection.insert({ createdBy: this.userId, references: [], ui })
  })
}

Beamer.methods.update = {
  name: 'beamer.methods.update',
  schema: (function () {
    const updateSchema = Object.assign({}, { _id: String }, Beamer.schema)
    delete updateSchema.createdBy
    return updateSchema
  })(),
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.teacher],
  numRequests: 100,
  timeInterval: 5000,
  run: onServer(function (updateDoc) {
    const modifier = Object.assign({}, updateDoc)
    const BeamerCollection = getCollection(Beamer.name)
    const { _id } = modifier
    const beamerDoc = BeamerCollection.findOne(_id)

    if (!beamerDoc) {
      throw new Meteor.Error('errors.docNotFound', _id)
    }
    if (beamerDoc.createdBy !== this.userId) {
      throw new Error('errors.permissionDenied')
    }

    delete modifier._id
    return BeamerCollection.update(_id, { $set: modifier })
  })
}

onClientExec(function () {
  const _beamerReady = new ReactiveVar(false)
  const _windowRef = new ReactiveVar(null)
  const _windowId = new ReactiveVar(null)
  const _windowUrl = new ReactiveVar(null)
  let _timerId

  const fallbackCallback = (err) => {
    if (err) console.error(err)
  }

  function clearTimer () {
    window.clearInterval(_timerId)
    _timerId = undefined
  }

  function initTimer (windowRef) {
    if (_timerId) clearTimer()

    const checkChild = () => {
      if (windowRef.closed) {
        clearTimer()
        Beamer.actions.unload()
      }
    }
    _timerId = setInterval(checkChild, 500)
  }

  function getMaterialIndex ({ beamerDoc, lessonId, referenceId, context, itemId }) {
    const references = beamerDoc.references || []
    const byMaterialProps = el => {
      if (el.lessonId !== lessonId) return false
      if (el.referenceId !== referenceId) return false
      if (typeof context === 'string' && el.context !== context) return false
      if (typeof itemId === 'string' && itemId.length > 0) {
        return el.itemId === itemId
      }
      return true
    }

    return references.findIndex(byMaterialProps)
  }

  Beamer.status = () => _windowRef.get()

  Beamer.doc = {}

  Beamer.doc.ready = (value) => {
    if (typeof value === 'undefined') {
      return _beamerReady.get()
    }
    else {
      return _beamerReady.set(Boolean(value))
    }
  }

  Beamer.doc.create = (callback) => {
    Meteor.call(Beamer.methods.insert.name, {}, callback)
  }

  Beamer.doc.get = () => getCollection(Beamer.name).findOne()

  Beamer.doc.update = (beamerDoc, callback = fallbackCallback) => {
    check(callback, Match.Maybe(Function))
    beamerDoc._id = beamerDoc._id || Beamer.doc.get()._id
    Meteor.call(Beamer.methods.update.name, beamerDoc, callback)
  }

  Beamer.doc.isBeamerWindow = () => {
    const beamerDoc = Beamer.doc.get()
    if (!beamerDoc || !beamerDoc.window) return false

    const windowId = beamerDoc.window.id
    return windowId === window.name
  }

  Beamer.doc.background = (value, callback) => {
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
    Beamer.doc.update(updateDoc, (err, res) => {
      if (err) return callback(err)
      if (!res) return new Error('errors.docNotUpdated')
      const beamerDoc = Beamer.doc.get()
      callback(undefined, beamerDoc.ui.background)
    })
  }

  Beamer.doc.grid = (value, callback) => {
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
    Beamer.doc.update(updateDoc, (err, res) => {
      if (err) return callback(err)
      if (!res) return new Error('errors.docNotUpdated')
      const beamerDoc = Beamer.doc.get()
      callback(undefined, beamerDoc.ui.grid)
    })
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
    Beamer.doc.update({ _id: beamerDoc._id, references }, callback)
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

  Beamer.actions = {
    debug (value) {},
    init (beamerLocation, { windowId, width, height, left, top, menubar = false, status = false, titlebar = false } = {}) {
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

      _windowRef.set(ref)
      initTimer(ref)
      _windowId.set(id)
      _windowUrl.set(beamerLocation)
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
      if (_timerId) clearTimer()
      const existingWindow = _windowRef.get()
      if (existingWindow && !existingWindow.closed) {
        // Firefox 46.0.1: scripts can not close windows, they had not opened
        existingWindow.close()
        if (!existingWindow.closed) {
          callback(new Error('beamer.errors.expectedWindowClose'))
        }
      }

      const windowId = _windowId.get()
      _windowRef.set(null)
      _windowUrl.set(null)
      _windowId.set(null)
      if (windowId && windowId !== global.window.name) {
        Beamer.doc.update({ window: { id: null, url: null } }, callback)
      }
      else {
        callback(null, true)
      }
    },
    key () {
      return _windowId.get()
    },
    url () {
      return _windowUrl.get()
    },
    timerId () {
      return _timerId
    },
    get () {
      return _windowRef.get()
    }
  }
})
