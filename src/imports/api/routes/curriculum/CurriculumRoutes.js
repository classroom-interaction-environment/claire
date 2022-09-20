import { Routes } from '../Routes'
import { TeacherRoutes } from '../teacher/TeacherRoutes'
import { createRedirect } from '../createRedirect'
import { createLoginTrigger } from '../triggers/createLoginTrigger'
import { createToRoute } from '../createToRoute'
import { loggedOut } from '../../accounts/user/loggedOut'
import { CurriculumSession } from '../../../ui/curriculum/CurriculumSession'

export const CurriculumRoutes = {}

const loginTrigger = createLoginTrigger(Routes.login)

const toDashboard = createRedirect(Routes.root, loggedOut)
const toUnitEditor = createToRoute(TeacherRoutes.unitEditor)
const enterCurriculum = () => CurriculumSession.enable()

CurriculumRoutes.curriculum = {
  path: () => '/curriculum',
  triggersEnter: () => [loginTrigger, toDashboard, enterCurriculum],
  async load () {
    return import('../../../ui/editors/curriculum/curriculum')
  },
  target: null,
  label: 'curriculum.title',
  template: 'curriculum',
  roles: null,
  data: {
    editUnit (unitId) {
      toUnitEditor(unitId)
    }
  }
}