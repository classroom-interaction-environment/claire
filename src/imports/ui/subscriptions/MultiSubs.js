
export const MultiSubs = {
  subscribe ({ subscriptions, subscribeHandler, onComplete }) {
    const allSubs = new Map()

    subscriptions.forEach(subDef => {
      allSubs.set(subDef.name, false)
    })

    const allReady = () => Array.from(allSubs.values()).every(value => value === true)

    subscriptions.forEach(subDef => {
      const { name } = subDef
      const { options } = subDef

      subscribeHandler({
        name,
        options,
        onReady: () => {
          allSubs.set(name, true)
          if (allReady()) {
            return onComplete()
          }
        }
      })
    })
  }
}
