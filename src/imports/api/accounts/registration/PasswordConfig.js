import { i18n } from '../../language/language'
import { Random } from 'meteor/random'

const exists = x => typeof x !== 'undefined' && x !== null
const defaults = {
  min: {
    value: 1,
    rule: true
  },
  max: {
    value: 256,
    rule: true
  },
  allowedChars: {
    value: '.*',
    rule: true,
    message: '*'
  },
  icon: undefined,
  confirm: true,
  blacklist: []
}

const map = new Map()

function build (settings) {
  const target = Object.assign({}, defaults, settings)
  const rules = []

  if (exists(target.min) && target.min.rule) {
    const min = target.min.value
    rules.push({
      test: value => value && value.length >= min,
      message: i18n.reactive('login.password.minimumChars', { min: min.toString() })
    })
  }

  if (exists(target.max) && target.max.rule) {
    const max = target.max.value
    rules.push({
      test: value => value && value.length <= max,
      message: i18n.reactive('login.password.maximumChars', { max: max.toString() })
    })
  }

  if (exists(target.allowedChars) && target.allowedChars.rule) {
    const allowedChars = new RegExp(target.allowedChars.value, 'i')
    const allowed = target.allowedChars.message
    rules.push({
      test: value => allowedChars.test(value),
      message: i18n.reactive('login.password.allowedChars', { allowed })
    })
  }

  if (target.blacklist && target.blacklist.length > 0) {
    const blacklistMessage = (value) => i18n.get('login.password.notEasyToGuess', { password: value })
    const blacklistRule = blacklist({ list: target.blacklist, message: blacklistMessage })
    rules.push(blacklistRule)
  }

  target.rules = rules

  // store in map
  const id = Random.id()
  map.set(id, target)
  return id
}

function blacklist ({ list, message }) {
  const blist = list.map(entry => new RegExp(entry.trim().toLowerCase(), 'i'))
  return {
    test: (value) => value && !blist.some(regExp => regExp.test(value)),
    message: message
  }
}

class PasswordConfig {
  static from (settings) {
    return new PasswordConfig(settings)
  }

  static defaults () {
    return Object.assign({}, defaults)
  }

  constructor (settings) {
    this.id = build(settings)
  }

  dispose () {
    delete map.get(this.id)
  }

  all () {
    const target = map.get(this.id)
    return target && Object.assign({}, target)
  }

  check (value) {
    const rules = this.rules()
    if (!rules || rules.length === 0) return

    const fails = []
    rules.forEach(rule => {
      if (!rule.test(value)) {
        fails.push(rule)
      }
    })

    if (fails.length > 0) {
      return fails
    }
  }

  rules () {
    const target = map.get(this.id)
    return target && target.rules
  }

  min () {
    const target = map.get(this.id)
    const min = target && target.min
    return exists(min && min.value) ? min.value : min
  }

  max () {
    const target = map.get(this.id)
    const max = target && target.max
    return exists(max && max.value) ? max.value : max
  }

  allowedChars () {
    const target = map.get(this.id)
    const allowedChars = target && target.allowedChars
    return exists(allowedChars && allowedChars.value) ? allowedChars.value : allowedChars
  }

  icon () {
    const target = map.get(this.id)
    return target && target.icon
  }

  confirm () {
    const target = map.get(this.id)
    return target && target.confirm
  }

  blacklist ({ list, message }) {
    const target = map.get(this.id)
    if (!target || !target.rules) return

    const rule = blacklist({ list, message })
    target.rules.push(rule)
    return target.rules
  }
}

export { PasswordConfig }
