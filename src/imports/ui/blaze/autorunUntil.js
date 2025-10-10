export const autorunUntil = (computationFunc, targetFunc) => {
  Tracker.autorun((c) => {
    if (computationFunc()) {
      c.stop()
      targetFunc()
    }
  })
}
