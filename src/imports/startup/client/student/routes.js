import { Router } from '../../../api/routes/Router'
import { Routes } from '../../../api/routes/Routes'
import { StudentRoutes } from '../../../api/routes/student/StudentRoutes'
import { studentContainer } from '../../../ui/containers/student/studentContainer'

Router.setDefaultTarget(studentContainer)

Object.keys(StudentRoutes).forEach(key => {
  Routes[key] = StudentRoutes[key]
})

Object.keys(Routes).forEach(key => {
  const route = Routes[key]
  route.key = key
  Router.register(route)
})
