import { check, Match } from 'meteor/check'
import { getStateManager } from './getStateManager'

export const create = ({ defaultState, loadComplete, onNext, onBack, onComplete }) => {
  check(defaultState, String)
  check(loadComplete, Match.Maybe(Function))
  check(onNext, Match.Maybe(Function))
  check(onBack, Match.Maybe(Function))
  check(onComplete, Match.Maybe(Function))

  const wizard = getStateManager(defaultState, onNext, onBack, onComplete)
  wizard.clear()

  wizard.onNext = onNext
  wizard.onBack = onBack
  wizard.onComplete = onComplete

  return wizard
}
