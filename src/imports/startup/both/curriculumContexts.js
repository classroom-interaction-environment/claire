import { Curriculum } from '../../contexts/curriculum/Curriculum.js'
import { WebResources } from '../../contexts/resources/web/WebResources'
import { ContextRegistry } from '../../infrastructure/context/ContextRegistry'
import { curriculumPipeline } from '../../contexts/curriculum/curriculumPipeline'

// code to run on server at startup
const curriculumContexts = Curriculum.getAllContexts(true)
const webResourcesContexts = Object.values(WebResources.contexts)
const allContexts = [].concat(curriculumContexts, webResourcesContexts)

allContexts.forEach(context => {
  curriculumPipeline(context)
  ContextRegistry.add(context)
})
