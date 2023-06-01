import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Task } from '../../../../../../contexts/curriculum/curriculum/task/Task'
import { Files } from '../../../../../../contexts/files/Files'
import { WebResources } from '../../../../../../contexts/resources/web/WebResources'
import { ContextRegistry } from '../../../../../../infrastructure/context/ContextRegistry'
import { getMaterialContexts } from '../../../../../../contexts/material/initMaterial'
import { Routes } from '../../../../../../api/routes/Routes'
import '../../../../../components/student/task/status/taskWorkingStatus'
import './lessonMaterial.html'

/**
 * Lesson Material Student
 *
 * This is a utility Template to render the material overview for a STUDENT,
 * where we not load all material but only show an overview of available material documents.
 * It also resolves the proper routes for the Material
 */

Template.lessonMaterial.setDependencies({
  contexts: getMaterialContexts()
})

Template.lessonMaterial.onCreated(function () {
  const instance = this
  instance.allContexts = new ReactiveVar()

  instance.autorun(() => {
    const data = Template.currentData()
    const { visible, scope, lessonId, groupId } = data
    const categories = new Set()

    ;(visible || []).forEach(({ context }) => {
      categories.add(context)
    })

    const allContexts = Array
      .from(categories)
      .map(ctxName => {
        const context = ContextRegistry.get(ctxName)
        const documents = visible
          .filter(entry => entry.context === ctxName)
          .map(entry => entry.document)

        if (!context) {
          return { name: ctxName, documents }
        }

        const { name, label, icon } = context
        const identity = getIdentity(context)
        const routeOptions = { lessonId, groupId, context: name, identity, scope }
        const route = createMaterialRoute(routeOptions)
        return { name, route, label, icon, documents }
      })

    instance.allContexts.set(allContexts)
  })
})

Template.lessonMaterial.helpers({
  visibleMaterial () {
    return Template.instance().allContexts.get()
  },
  isTask (context) {
    return context === Task.name
  }
})

const createMaterialRoute = ({ lessonId, scope, groupId, identity, context }) => {
  const lessonMaterialRoute = Routes[identity]
  const withGroup = scope === 'group'
  return materialId => {
    const finalGroupId = withGroup
      ? groupId
      : 'none'
    return lessonMaterialRoute.path(lessonId, context, materialId, finalGroupId)
  }
}

// TODO extract into own file
const getIdentity = ctx => {
  if (ctx === Task) return Task.name
  if (Files.hasIdentity(ctx)) return Files.name

  // TODO replace with isWebResource
  if (ctx.isWebResource) return WebResources.name

  console.warn(`Unexpected undefined domain for context [${ctx.name}]`)
}
