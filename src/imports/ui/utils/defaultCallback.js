import { Notify } from '../components/notifications/Notify'

const nothing = undefined

export const defaultCallback = (cb) => {
  return (err, res) => {
    if (err) {
      return cb ? cb(err, nothing) : Notify.add({ type: 'error', message: err.reason || err.message })
    } else {
      return cb ? cb(nothing, res) : Notify.add({ type: 'error' })
    }
  }
}
