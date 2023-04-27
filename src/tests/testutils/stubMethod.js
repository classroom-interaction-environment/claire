import { Meteor } from 'meteor/meteor'
import sinon from 'sinon'

const _methods = {}

const callHandler = function (name, ...args) {
  if (Meteor.isServer) {
    return _methods[name](...args)
  }

  // Meteor.call always require the last param to be a callback
  const callback = args.pop()
  if (typeof callback !== 'function') {
    throw new Error(`No callback function is provided, ${args.toString()}`)
  }

  // if not registered throw an error
  // this also forces devs to stub all methods in a current
  // execution context, so don't be lazy
  if (!_methods[name]) {
    throw new Error(`Method does not exists: ${name}`)
  }

  // get the handler and simulate a process tick
  // to enforce async behavior like the server call
  const handler = _methods[name]
  try {
    const result = handler(...args)
    setTimeout(() => {
      callback(undefined, result)
    }, 25)
  }
  catch (e) {
    setTimeout(() => {
      callback(e)
    }, 25)
  }
}

let _stubbed = false

function clear () {
  if (!_stubbed) throw new Error('expected call to be stubbed')
  for (const entry in _methods) {
    delete _methods[entry]
  }
  Meteor.call.restore()
  _stubbed = false
}

export const stubMethod = function (name, handler) {
  if (!name || !handler) {
    console.error('Invalid args', name, handler)
    throw new Error('Invalid args')
  }

  if (!_stubbed) {
    sinon.stub(Meteor, 'call').callsFake(callHandler)
    _stubbed = true
  }
  _methods[name] = handler
}

export const unstubMethod = function (name) {
  if (!name) return clear()
  delete _methods[name]
  if (Object.keys(_methods).length === 0) {
    clear()
  }
}
