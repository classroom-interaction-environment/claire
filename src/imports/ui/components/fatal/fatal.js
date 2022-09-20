import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { debounce } from '../../../api/utils/debounce'
import './fatal.html'

const state = new ReactiveDict({
  message: null,
  reason: null,
  details: null,
  stack: null,
  source: null,
  target: null
})

Template.fatal.helpers({
  errorId () {
    return state.get('errorId')
  },
  title () {
    return state.get('title')
  },
  message () {
    return state.get('message')
  },
  reason () {
    return state.get('reason')
  },
  details () {
    return state.get('details')
  },
  stack () {
    return state.get('stack')
  },
  source () {
    return state.get('source')
  }
})

Template.fatal.onRendered(function () {
  const instance = this
  instance.autorun(() => {
    const target = state.get('target')
    const open = state.get('open')
    if (open || !target) return

    const $modal = instance.$(`#${target}`)
    if (!$modal || !$modal.get(0)) {
      throw new Error(`Unexpected missing modal for "${target}"`)
    }
    $modal.modal('show')
    instance.state.set('open', true)
  })
})

Template.fatal.events({
  'hidden.bs.modal' (event, templateInstance) {
    templateInstance.state.set('open', false)
  }
})

const toMessage = message => {
  const type = typeof message
  if (type === 'string') return message
  if (type === 'number') return `errors.${message}`

  return String(message)
}

export const setFatalError = debounce((error = new Error(), { modalId = 'fatal-error-modal' } = {}) => {
  const { details } = error
  let errorId
  let source

  const proto = details && Object.prototype.toString.call(details)
  if (proto === '[object Array]') {
    const found = details.find(entry => Object.hasOwnProperty.call(entry, 'errorId'))
    errorId = found.errorId
    source = found.source
  }

  if (proto === '[object Object]') {
    errorId = details.errorId
    source = details.source
  }

  if (error instanceof Meteor.Error) {
    state.set({
      message: toMessage(error.error)
    })
  }

  else if (error instanceof Error) {
    state.set({
      message: error.message
    })
  }

  else {
    throw new TypeError('Expected error to be Error')
  }

  state.set({
    errorId,
    source,
    target: modalId,
    reason: error.reason,
    details: error.details,
    stack: error.stack
  })
}, 1000)
