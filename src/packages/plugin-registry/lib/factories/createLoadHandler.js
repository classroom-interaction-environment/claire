export const createLoadHandler = ({ target }) => {
  return async function () {
    const all = Array.from(target.registered.entries())
    const imports = all.map(entry => {
      const importFct = entry[1]
      return importFct()
    })
    return Promise.all(imports)
      .then(allResolved => {
        target.registered.clear()

        return allResolved.map((plugin, index) => {
          return { name: all[index][0], plugin }
        })
      })
  }
}