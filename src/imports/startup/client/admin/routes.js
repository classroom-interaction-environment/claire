import { AdminRoutes } from '../../../api/routes/admin/AdminRoutes'
import { Router } from '../../../api/routes/Router'
import { Routes } from '../../../api/routes/Routes'

// admin runs also in teacher container
import { teacherContainer } from '../../../ui/containers/teacher/teacherContainer'

Router.setDefaultTarget(teacherContainer)

Object.keys(AdminRoutes).forEach(key => {
  const route = AdminRoutes[key]
  Routes[key] = route
  if (Router) {
    Router.register(route)
  }
  else {
    console.warn('could not register route', key)
  }
})
