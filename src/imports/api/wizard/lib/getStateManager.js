import { ReactiveVar } from 'meteor/reactive-var'

const byState = stateName => entry => entry.name === stateName
const findStateIndex = (stack, name) => stack.findIndex(byState(name))

export const getStateManager = (defaultState, onNext, onBack) => {
  const state = new ReactiveVar()

  return {
    clear (flush) {
      if (flush) {
        state.set([])
      } else {
        state.set([{ name: defaultState, complete: false, component: null }])
      }
    },
    pushView (nextStateName, componentName) {
      const viewStack = state.get()
      const stackLen = viewStack.length - 1

      if (viewStack[stackLen]) {
        viewStack[stackLen].complete = true
        viewStack[stackLen].component = componentName
      }
      viewStack.push({ name: nextStateName })
      state.set(viewStack)

      if (onNext) onNext(viewStack)

      // scroll next / previous step into view
      setTimeout(() => {
        const targetName = `.${nextStateName}-scrollanchor`
        const $target = $(targetName)
        if ($target && $target.get(0)) {
          $target.get(0).scrollIntoView({ behavior: 'smooth' })
        }
      }, 50)
    },
    popView () {
      const viewStack = state.get()
      viewStack.pop()
      const stackLen = viewStack.length - 1
      if (!viewStack[stackLen]) return

      viewStack[stackLen].complete = false
      viewStack[stackLen].component = null
      state.set(viewStack)

      if (onBack) onBack(viewStack)

      const prevName = viewStack[stackLen].name
      if (prevName) {
        setTimeout(() => {
          const targetName = `.${prevName}-scrollanchor`
          const $target = $(targetName)
          if ($target && $target.get(0)) {
            $target.get(0).scrollIntoView({ behavior: 'smooth' })
          }
        }, 50)
      }
    },
    stateVisible (stateName) {
      const viewStack = state.get()
      if (!viewStack || viewStack.length === 0) return false
      return findStateIndex(viewStack, stateName) > -1
    },
    isCurrentState (stateName) {
      const viewStack = state.get()
      if (!viewStack || viewStack.length === 0) return false
      const stateIndex = findStateIndex(viewStack, stateName)
      return stateIndex === viewStack.length - 1
    },
    stepComplete (stateName) {
      const viewStack = state.get()
      if (!viewStack || viewStack.length === 0) return false
      const stateIndex = findStateIndex(viewStack, stateName)
      return stateIndex > -1 && viewStack[stateIndex] && viewStack[stateIndex].complete === true
    },
    isDisabled (stateName, componentName) {
      const viewStack = state.get()
      if (!viewStack || viewStack.length === 0) return false
      const stateIndex = findStateIndex(viewStack, stateName)
      return stateIndex > -1 && viewStack[stateIndex] &&
        viewStack[stateIndex].complete === true && viewStack[stateIndex].component !== componentName
    },
    wasSelected (stateName, componentName) {
      const viewStack = state.get()
      if (!viewStack || viewStack.length === 0) return false
      const stateIndex = findStateIndex(viewStack, stateName)
      return stateIndex > -1 && viewStack[stateIndex] &&
        viewStack[stateIndex].complete === true && viewStack[stateIndex].component === componentName
    }
  }
}