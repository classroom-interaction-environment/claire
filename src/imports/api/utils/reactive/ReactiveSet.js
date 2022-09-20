import { Tracker } from 'meteor/tracker'
import { EJSON } from 'meteor/ejson'

function stringify (value) {
  if (value === undefined) {
    return 'undefined'
  }
  return EJSON.stringify(value)
}

function parse (serialized) {
  if (serialized === undefined || serialized === 'undefined') {
    return undefined
  }
  return EJSON.parse(serialized)
}

function changed (v) {
  v && v.changed()
}

function ensure (value, deps) {
  if (!(value in deps)) {
    deps[value] = new Tracker.Dependency()
  }
}

/**
 * @class
 * @instanceName ReactiveDict
 * @summary Constructor for a ReactiveSet, which represents a reactive Set.
 * @locus Client
 */
class ReactiveSet {

  /**
   *
   */
  constructor () {
    this.set = new Set()
    this.deps = {}
    this.allDeps = new Tracker.Dependency()
  }

  /**
   *
   * @param value
   * @return {ReactiveSet}
   */
  add (value) {
    const stringValue = stringify(value)

    // we simply ignore values that are already in the set
    if (this.set.has(stringValue)) {
      return this
    }

    this.set.add(stringValue)
    changed(this.allDeps)
    changed(this.deps[stringValue])
  }

  /**
   *
   * @param value
   * @return {boolean}
   */
  has (value) {
    const stringValue = stringify(value)
    ensure(stringValue, this.deps)
    this.deps[stringValue].depend()
    return this.set.has(stringValue)
  }

  /**
   *
   * @param value
   * @return {boolean}
   */
  delete (value) {
    let didRemove = false
    const stringValue = stringify(value)

    if (this.set.has(stringValue)) {
      didRemove = this.set.delete(stringValue)
      changed(this.deps[stringValue])
      changed(this.allDeps)
    }

    return didRemove
  }

  /**
   *
   * @return {any[]}
   */
  all () {
    this.allDeps.depend()
    return Array.from(this.set).map(parse)
  }

  /**
   *
   */
  clear () {
    const oldValues = Array.from(this.set)
    this.set.clear()
    this.allDeps.changed()

    Object.keys(oldValues).forEach(stringValue => {
      changed(this.deps[stringValue])
    })
  }
}

export { ReactiveSet }
