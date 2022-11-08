import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Random } from 'meteor/random'
import { formIsValid, formReset } from '../formUtils'
import './formModal.html'

const API = Template.formModal.setDependencies()
const state = new ReactiveVar(null)
const defaultId = 'formModal'
const formId = 'modalForm'
const colors = {
  create: 'success',
  update: 'primary',
  remove: 'danger',
  other: 'info',
  view: 'secondary'
}
const icons = {
  create: 'plus',
  update: 'sync',
  remove: 'trash',
  other: 'info',
  view: 'eye'
}
const getFormId = action => `${formId}-${action}`
const resultCache = new WeakMap()

Template.formModal.helpers({
  formState () {
    return state.get()
  },
  successful () {
    return Template.getState('successful')
  },
  formIsBlocked () {
    const formState = state.get() || {}
    return ['remove', 'view'].includes(formState.action) || Template.getState('submitting')
  },
  hideLegend () {
    const formState = state.get() || {}
    return formState.hideLegend || formState.action === 'remove'
  },
  collapsed () {
    const formState = state.get() || {}
    return formState.collapsed || formState.action === 'remove'
  },
  submitting () {
    return Template.getState('submitting')
  },
  submitDisabled (codeRequired) {
    return codeRequired && !Template.getState('codeIsValid')
  },
  error () {
    return Template.getState('error')
  }
})

Template.formModal.events({
  'input .confirm-input' (event, templateInstance) {
    const { code } = state.get()
    const current = templateInstance.$(event.currentTarget).val()
    templateInstance.state.set('codeIsValid', code === current)
  },
  'submit .modal-form': async (event, templateInstance) => {
    event.preventDefault()
    const submitter = event.originalEvent.submitter
    const customKey = submitter.getAttribute('data-custom')
    const formState = state.get()
    const isUpdate = formState.action === 'update'
    const isRemove = formState.action === 'remove'
    const formDoc = isRemove
      ? formState.doc
      : formIsValid(formState.schema, formState.formId, isUpdate, formState.debug)

    if (!formDoc) {
      return
    }

    // clear validation errors, if they remained
    AutoForm.removeStickyValidationError(formState.formId)

    templateInstance.state.set('submitting', true)

    let onSubmitHandler = customKey && formState.rawCustom[customKey]?.onSubmit

    if (!onSubmitHandler) {
      onSubmitHandler = formState.onSubmit
    }
    if (!onSubmitHandler) {
      throw new Error('Expect handler for onSubmit event, got none')
    }

    templateInstance.state.set({ customKey })

    try {
      const result = await onSubmitHandler({ doc: formDoc, ...formState.bind })
      resultCache.set(formState, result)
      templateInstance.state.set('successful', true)

      const hideModalHandler = () => API.hideModal(defaultId)
      setTimeout(hideModalHandler, formState.timeout)
    }
    catch (e) {
      console.error(e.name, e.message, e.details)

      // use the details to attach sticky error messages to the form
      if (e.details) {
        const details = Array.isArray(e.details)
          ? e.details
          : [e.details]

        details.forEach(err => {
          const field = err.key || err.name
          const type = err.type || 'genericError'
          const message = err.message || err.value
          AutoForm.addStickyValidationError(formState.formId, field, type, message)
        })
      }

      templateInstance.state.set({
        error: {
          name: e.error || e.name,
          message: e.reason || e.message
        }
      })

      templateInstance.state.set({ successful: false })
    }
    finally {
      templateInstance.state.set('submitting', false)
    }
  },
  'hidden.bs.modal' (event, templateInstance) {
    const formState = state.get()
    const cachedResult = resultCache.get(formState)
    const customKey = templateInstance.state.get('customKey')
    const successful = templateInstance.state.get('successful')

    let onClosedHandler = customKey && formState.rawCustom[customKey]?.onClosed
    let onCloseResult
    if (!onClosedHandler) {
      onClosedHandler = formState.onClosed
    }
    if (onClosedHandler) {
      try {
        onCloseResult = onClosedHandler({
          successful: successful,
          result: cachedResult,
          ...formState.bind
        })
      }
      catch (e) {
        // TODO should we pipe this trough formState.onError?
        console.error(e)
      }
    }

    if (onCloseResult) {
      const nextState = onCloseResult.next
      const copyState = { ...formState }
      const { bind } = copyState
      nextState.bind = bind

      // onClosed hooks can manipulate the bind context, for example
      // they may add the result of their submission as part of the input
      // for the submission of the follow-up form
      if (onCloseResult.bind) {
        Object.assign(nextState.bind, onCloseResult.bind)
      }
      // XXX monkey patch we should have named this handlers right from the beginning...
      if (nextState.handlers) {
        nextState.custom = nextState.handlers
      }
      delete formState.bind
      setTimeout(() => FormModal.show(nextState), formState.timeout)
    }

    // clear modal state
    templateInstance.state.set({
      successful: null,
      submitting: null,
      error: null,
      customKey: null
    })

    // dispose temp data
    resultCache.delete(formState)
    formReset(formState.formId)
    state.set(null)
  }
})

export const FormModal = {
  show: ({
    action,
    schema,
    timeout = 500,
    doc,
    load,
    bind,
    custom,
    onSubmit,
    validation,
    onClosed,
    onError,
    title,
    description,
    debug,
    codeRequired,
    hideLegend,
    collapse
  }) => {
    const modalData = state.get()

    if (modalData) {
      return // TODO close modal and reopen with new data?
    }

    const formState = { action, bind, doc, onSubmit, timeout, onError, onClosed, title, validation, description, debug }

    formState.color = colors[formState.action] || colors.other
    formState.class = `bg-${formState.color} text-white`
    formState.icon = icons[formState.action] || icons.other
    formState.actionLabel = `actions.${formState.action || 'submit'}`
    formState.formId = getFormId(formState.action)
    formState.hideLegend = hideLegend || action === 'remove'
    formState.collapse = collapse || (action === 'remove' && false)
    formState.codeRequired = codeRequired || action === 'remove'

    formState.doc = formState.action === 'create' ? null : formState.doc

    if (typeof custom === 'object') {
      formState.custom = Object.entries(custom).map(([key, value]) => ({ key, ...value }))
      formState.rawCustom = custom
    }

    if (formState.codeRequired) {
      formState.code = Random.id(4).toLowerCase()
    }

    // typically schema is already a schema instance,
    // however, in order to pass bounded contexts to the schema
    // internals, we can also use a function that returns the schema

    formState.schema = typeof schema === 'function'
      ? schema({ ...bind })
      : schema

    // if nothing to load (template, custom form input types) just continue
    if (!load) {
      formState.loadComplete = true
      if (typeof formState.doc === 'function') {
        formState.doc = formState.doc({ ...bind })
      }
    }

    // else trigger loading in case we have something to load
    // which is often the case if we want to use custom forms
    else {
      formState.loadComplete = false
      load(bind)
        .catch(e => onError ? onError(e) : console.error(e))
        .then(() => {
          const _formState = state.get()
          if (typeof _formState.doc === 'function') {
            _formState.doc = _formState.doc({ ...bind })
          }
          _formState.loadComplete = true
          state.set(_formState)
        })
    }

    state.set(formState)
    API.showModal(defaultId)
  },
  hide: () => API.hideModal(defaultId)
}
