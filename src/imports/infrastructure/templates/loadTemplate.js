import { ReactiveVar } from 'meteor/reactive-var'
import { setFatalError } from '../../ui/components/fatal/fatal'
import { delayedCallback } from '../../ui/utils/delayedCallback'

const importedTemplates = new Map()

export const loadTemplate = ({ template, load }) => {
  if (importedTemplates.has(template)) {
    return importedTemplates.get(template)
  }

  const loaded = new ReactiveVar()
  importedTemplates.set(template, loaded)

  load()
    .then(delayedCallback(300, function () {
      loaded.set(true)
    }))
    .catch(e => {
      console.error(e)
      setFatalError(e)
    })

  return loaded
}
