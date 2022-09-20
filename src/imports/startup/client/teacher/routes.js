import { TeacherRoutes } from '../../../api/routes/teacher/TeacherRoutes'
import { Router } from '../../../api/routes/Router'
import { Routes } from '../../../api/routes/Routes'
import { teacherContainer } from '../../../ui/containers/teacher/teacherContainer'
import { userIsCurriculum } from '../../../api/accounts/userIsCurriculum'
import '../../../ui/containers/beamer/beamerContainer'

Router.setDefaultTarget(teacherContainer)

// if the user is a curriculum user, we first load the CurriculumRoutes

if (userIsCurriculum()) {
  console.debug('[Routes]: load curriculum routes')
  import('../../../api/routes/curriculum/CurriculumRoutes')
    .then(({ CurriculumRoutes }) => {
      Object.assign(TeacherRoutes, CurriculumRoutes)
    })
    .catch(e => {
      console.error(e)
    })
    .finally(() => {
      loadRoutes(TeacherRoutes)
    })
}

// for "normal" teachers we only load the TeacherRoutes

else {
  loadRoutes(TeacherRoutes)
}

function loadRoutes (target) {
  console.debug('[Routes]: load teacher')
  Object.keys(target).forEach(key => {
    Routes[key] = target[key]
  })

  Object.keys(Routes).forEach(key => {
    const route = Routes[key]
    route.key = key
    Router.register(route)
  })
}
