export const lazyInitialize = loadFunction => {
  let product

  return function (...args) {
    const self = this
    console.log('run', loadFunction)
    if (!product) {
      product = loadFunction()
    }
    return product.apply(self, args)
  }
}