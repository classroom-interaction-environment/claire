const listKeys = (x= {}) => {
  for (const nameKey in x) {
    console.debug(nameKey, typeof x)
  }
}
export const asyncReadyMixin = function (options) {
  const { name, run } = options
  const body = run.toString().split(/\n+/g)
  options.isAsyncReady = body[1].includes('return Promise.asyncApply(() => {')
  addToList(name, options.isAsyncReady)

  return options
}

const internal = { list: [] }

global.getAsyncReadySummary = ({ printNames } = {}) => {
  const { list } = internal
  const max = list.length
  let ready = 0
  list.forEach(([name, isReady]) => {
    if (isReady) {
      ready++
    }
    else if (printNames) {
      console.log('Not Async Ready:', name)
    }
  })
  const notReady = max - ready
  const divisor = max || 1
  const notReadyPerc = 100 * notReady / divisor
  const readyPerc = 100 * ready / divisor
  console.log('-------------------')
  console.log('Async Ready Summary')
  console.log('-------------------')
  console.log('count', max)
  console.log('ready', ready, `(${readyPerc.toFixed(2)}%)`)
  console.log('todo!', notReady, `(${notReadyPerc.toFixed(2)}%)`)
}

const addToList = (name, isAsyncReady) => {
  internal.list.push([name, isAsyncReady])
}
