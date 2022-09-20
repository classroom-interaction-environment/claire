import sinon from 'sinon'
const _stubs = new Map()

export const stub = (target, name, handler) => {
  if (_stubs.get(target)) {
    throw new Error(`already stubbed: ${name}`)
  }

  const stubbedTarget = sinon.stub(target, name)
  stubbedTarget.callsFake(handler)

  _stubs.set(stubbedTarget, name)
}

export const restore = (target, name) => {
  if (!target[name] || !target[name].restore) {
    return // TODO info here?
  }

  target[name].restore()
  _stubs.delete(target)
}

export const restoreAll = () => {
  _stubs.forEach((name, target) => {
    target.restore()
    _stubs.delete(target)
  })
}

export const isStubbed = (target, name) => {
  return Boolean(target[name]?.restore)
}
