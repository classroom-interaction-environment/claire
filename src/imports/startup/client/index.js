import { Meteor } from 'meteor/meteor'
import { Blaze } from 'meteor/blaze'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { Router } from '../../api/routes/Router'
import { Hierarchy } from '../../api/accounts/roles/Hierarchy'
import { dynamicImport } from '../../ui/utils/dynamicImport'
import { createLog } from '../../api/log/createLog'
import { UserRoles } from '../../api/roles/UserRoles'
import { getHighestRole } from '../../api/accounts/roles/getHighestRole'

if (Blaze.setExceptionHandler) Blaze.setExceptionHandler(console.error)
if (Template.stateName) Template.stateName('state')

const debug = createLog({ name: 'routes', type: 'debug' })

const minimalLoaded = dynamicImport([
  import('./minimal/index')
])

const reloadRoute = () => {
  setTimeout(() => {
    Router.go(window.location.pathname + window.location.search)
  }, 50)
}

Tracker.autorun((computation) => {
  if (!minimalLoaded.get()) {
    return
  }
  const userId = Meteor.userId()

  if (!userId) {
    return loadMinimalRoutes()
      .catch(e => console.error(e))
      .then(() => {
        debug('minimal routes loaded')
        reloadRoute()
      })
  }

  if (!UserRoles.subscription.ready()) return

  loadUserRoutes(userId)
    .catch(e => console.error(e))
    .then(role => {
      debug(`${role}-specific routes loaded`)
      reloadRoute()
    })

  computation.stop()
})

async function loadUserRoutes (userId) {
  const role = await getHighestRole(userId)
  switch (role) {
    case Hierarchy.student:
      return await loadStudent() && role
    case Hierarchy.teacher:
      return await loadTeacher() && role
    case Hierarchy.curriculum:
      return await loadCurriculum() && role
    case Hierarchy.schoolAdmin:
    case Hierarchy.admin:
      return await loadAdmin() && role
    default:
      throw new Error('Undefined role:', role)
  }
}

async function loadMinimalRoutes () {
  debug('load minimal routes')
  return import('./minimal/routes')
}

async function loadStudent () {
  debug('load student routes')
  return import('./student/index')
}

async function loadTeacher () {
  return import('./teacher/index')
}

async function loadCurriculum () {
  await loadTeacher()
  debug('load admin routes')
  return import('./curriculum/index')
}

async function loadAdmin () {
  await loadTeacher()
  debug('load admin routes')
  return import('./admin/index')
}
