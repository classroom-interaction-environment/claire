import { Random } from 'meteor/random'
import { Tracker } from 'meteor/tracker'
import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { ReactiveDict } from 'meteor/reactive-dict'
import './confirm.scss'
import './confirm.html'

const state = new ReactiveDict({
  title: undefined,
  text: undefined,
  headerClass: 'bg-secondary text-white',
  static: false,
  codeRequired: false,
  codeSize: 0,
  code: undefined,
  dismiss: false
})

const result = new ReactiveVar(null)
const viewState = new ReactiveVar()
const errorState = new ReactiveVar(null)
const API = Template.confirm.setDependencies()

Template.confirm.helpers({
  loadComplete () {
    return API.initComplete()
  },
  state (fieldName) {
    return state.get(fieldName)
  },
  title () {
    return Template.getState('title') || state.get('title')
  },
  headerClass () {
    const type = state.get('type')
    return `bg-${type} text-white`
  },
  approveDisabled () {
    if (!state.get('codeRequired')) return
    return !codeIsValid()
  },
  approveType () {
    const type = state.get('type')
    return `outline-${type}`
  }
})

Template.confirm.events({
  'click .confirm-approve-button' (event, templateInstance) {
    event.preventDefault()
    completeDialog(true, templateInstance)
  },
  'click .confirm-deny-button' (event, templateInstance) {
    event.preventDefault()
    completeDialog(false, templateInstance)
  },
  'hidden.bs.modal' (event, templateInstance) {
    // empty the input if present on hidden
    // because in case of reopening the modal
    // we want the code input to be empty
    const $input = templateInstance.$('.confirm-input')
    if ($input && $input.get(0)) {
      $input.val(null)
    }
    viewState.set('hidden')
  },
  'input .confirm-input' (event, templateInstance) {
    const value = templateInstance.$(event.currentTarget).val()
    result.set(value)
  },
  'keydown .confirm-input' (event, templateInstance) {
    // we activate the approve-on-enter functoinality
    // only if the code is valid
    if (!codeIsValid()) return
    if (event.key === 'Enter') {
      completeDialog(true, templateInstance)
    }
  }
})

Template.confirm.onRendered(function () {
  const instance = this
  instance.autorun(() => {
    // skip autorun unless we invoked the confirmDialog
    // which itself sets the viewState to 'open'
    if (viewState.get() !== 'open') return

    // we need a target to activate the modal
    const target = state.get('target')
    if (!target) {
      return console.warn('[confirm]: has no target')
    }

    const modal = instance.$(target) || window.$(target)
    if (!modal || !modal.get(0)) {
      return errorState.set(new Error(`Expected target by selector "${target}" on modal show`))
    }

    modal.modal('show')
    viewState.set('visible')

    if (state.get('codeRequired')) {
      setTimeout(() => instance.$('.confirm-input').focus(), 500)
    }
  })
})

function completeDialog (value = false, templateInstance) {
  result.set(value)
  const target = state.get('target')
  const modal = templateInstance.$(target) || window.$(target)
  if (!modal || !modal.get(0)) {
    return errorState.set(new Error(`Expected target by selector "${target}" on modal hide`))
  }
  modal.modal('hide')
}

function codeIsValid () {
  return result.get() === state.get('code')
}

export const confirmDialog = function confirmDialog ({ target = '#confirm-modal', title = 'actions.confirm', timeout = 25, type = 'secondary', text, textOptions, codeRequired = false, codeSize = 4 }) {
  const options = { target, title, text, textOptions, type, codeRequired, codeSize }

  if (codeRequired) {
    options.code = Random.id(codeSize).toLowerCase()
  }

  state.set(options)
  result.set(null)
  viewState.set('open')

  return new Promise((resolve, reject) => {
    Tracker.autorun(computation => {
      const error = errorState.get()
      if (error instanceof Error) {
        computation.stop()
        return reject(error)
      }

      if (viewState.get() !== 'hidden') return
      computation.stop()

      const resultValue = result.get()
      state.set({})
      viewState.set(null)
      return resolve(resultValue === true)
    })
  })
}
