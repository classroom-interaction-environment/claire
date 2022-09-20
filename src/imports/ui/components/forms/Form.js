import { ReactiveVar } from 'meteor/reactive-var'
import { createDebugLog, createInfoLog } from '../../../api/log/createLog'
import { setFatalError } from '../fatal/fatal'
import 'meteor/aldeed:autoform/dynamic'
import { AutoFormPassword2 } from 'meteor/jkuester:autoform-password2/dynamic'
import { AutoFormThemeBootstrap4 } from 'meteor/communitypackages:autoform-bootstrap4/dynamic'

const initialized = new ReactiveVar()
const formName = 'Form'
const debug = createDebugLog(formName, 'debug', { devOnly: true })

export const Form = {}
Form.name = formName

Form.initialized = function () {
  if (!initialized.get()) {
    initForms()
      .then(() => initialized.set(true))
      .catch(e => setFatalError(e))
  }
  return initialized
}

Form.renderer = {
  template: 'caroForm',
  load: async function () {
    return import('./caroform/caroform')
  }
}

export const initForms = async function initForms () {
  debug('laod AutoForm')
  await AutoForm.load()

  debug('load BS4 theme')
  await AutoFormThemeBootstrap4.load()
  AutoForm.setDefaultTemplate('bootstrap4')

  await AutoFormPassword2.load()

  debug('load renderer')
  Form.renderer.load()
}
