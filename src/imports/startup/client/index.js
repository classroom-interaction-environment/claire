import { Meteor } from 'meteor/meteor'
import { Blaze } from 'meteor/blaze'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { Router } from '../../api/routes/Router'
import { Roles } from 'meteor/alanning:roles'
import { dynamicImport } from '../../ui/utils/dynamicImport'
import { createLog } from '../../api/log/createLog'

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

  if (!Roles.subscription.ready()) return

  loadUserRoutes(userId)
    .catch(e => console.error(e))
    .then(role => {
      debug(`${role}-specific routes loaded`)
      reloadRoute()
    })

  computation.stop()
})

async function loadUserRoutes (userId) {
  const { UserUtils } = await import('../../contexts/system/accounts/users/UserUtils')
  const role = UserUtils.getHighestRole(userId)
  switch (role) {
    case UserUtils.roles.student:
      return await loadStudent() && role
    case UserUtils.roles.teacher:
      return await loadTeacher() && role
    case UserUtils.roles.curriculum:
      return await loadCurriculum() && role
    case UserUtils.roles.schoolAdmin:
    case UserUtils.roles.admin:
      return await loadAdmin() && role
    default:
      console.warn('Undefined role:', role)
  }
}

async function loadMinimalRoutes () {
  console.info('load minimal routes')
  return import('./minimal/routes')
}

async function loadStudent () {
  console.info('load student routes')
  return import('./student/index')
}

async function loadTeacher () {
  return import('./teacher/index')
}

async function loadCurriculum () {
  await loadTeacher()
  console.info('load admin routes')
  return import('./curriculum/index')
}

async function loadAdmin () {
  await loadTeacher()
  console.info('load admin routes')
  return import('./admin/index')
}
