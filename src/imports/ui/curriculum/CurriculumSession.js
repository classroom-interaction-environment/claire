import { ReactiveVar } from 'meteor/reactive-var'
import { createLog } from '../../api/log/createLog'

export const CurriculumSession = {}

const debug = createLog({ name: 'CurriculumSession', type: 'debug' })
const handlers = new Set()
const session = new ReactiveVar()

CurriculumSession.onStateChange = fn => handlers.add(fn)

CurriculumSession.enable = () => {
  const current = session.get()
  debug('enable', current)
  if (current) { return }
  session.set(true)
  handlers.forEach(handler => handler(true))
}

CurriculumSession.disable = () => {
  const current = session.get()
  debug('disable', current)
  if (!current) { return }
  session.set(false)
  handlers.forEach(handler => handler(false))
}

CurriculumSession.isSession = () => session.get()
