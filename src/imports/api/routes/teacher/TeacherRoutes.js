import { Meteor } from 'meteor/meteor'
import { Routes } from '../Routes'
import { Router } from '../Router'
import { toQueryParams } from '../queryParams'
import { createToRoute } from '../createToRoute'
import { createLoginTrigger } from '../triggers/createLoginTrigger'
import { leaveCurriculum } from '../triggers/leaveCurriculum'

/**
 * These routes do only apply for users with teacher role and above.
 */
export const TeacherRoutes = {}

const studentTrigger = function () {}

const loginTrigger = createLoginTrigger(Routes.login)

const toDashboard = () => {
  if (!Meteor.userId()) return
  Router.go(TeacherRoutes.dashboard)
}

TeacherRoutes.root = {
  path: () => '/',
  triggersEnter: () => [leaveCurriculum, loginTrigger, toDashboard],
  async load () {
    return true
  },
  target: null,
  label: 'routes.redirect',
  template: null,
  roles: null,
  data: null
}

TeacherRoutes.dashboard = {
  path: () => '/dashboard',
  triggersEnter: () => [leaveCurriculum, loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/pages/dashboard/dashboard')
  },
  target: null,
  label: 'routes.dashboard',
  template: 'dashboard',
  roles: null,
  data: {
    unitEditor: ({ unitId }) => {
      const toUnitEditor = createToRoute(Routes.unitEditor)
      toUnitEditor(unitId)
    }
  }
}

/*
TeacherRoutes.logout = {
  path: () => '/logout',
  triggersEnter: () => [leaveCurriculum, createLoginTrigger(Routes.root)],
  async load () {
    return import('../../../ui/pages/logout/logout')
  },
  target: null,
  label: 'routes.logout',
  template: 'logout',
  roles: null,
  data: null
}
*/

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// USER MENU
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

TeacherRoutes.inviteUsers = {
  template: 'inviteUsers',
  label: 'inviteUsers.title',
  description: 'inviteUsers.description',
  path: () => '/invite',
  icon: 'envelope',
  triggersEnter () { return [leaveCurriculum, loginTrigger, studentTrigger] },
  target: null,
  async load () {
    return import('../../../ui/pages/inviteUsers/inviteUsers')
  },
  data: {}
}

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// PREPARE
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

TeacherRoutes.prepare = {
  path: () => '/prepare',
  triggersEnter: () => [leaveCurriculum, loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/pages/prepare/prepare')
  },
  target: null,
  template: 'prepare',
  label: 'prepare.title',
  roles: null,
  data: {
    onComplete ({ classId }) {
      const toDashboard = createToRoute(Routes.dashboard)
      toDashboard({ classId })
    },
    onCompleteEdit ({ unitId }) {
      const toUnitEditor = createToRoute(Routes.unitEditor)
      toUnitEditor(unitId)
    }
  }
}

TeacherRoutes.lessons = {
  path: () => '/lessons',
  triggersEnter: () => [leaveCurriculum, loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/pages/lessons/lessons')
  },
  target: null,
  template: 'lessons',
  label: 'lessons.title',
  roles: null,
  data: null
}

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// EDITORS
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

TeacherRoutes.unitEditor = {
  path: (unitId = ':unitId', tab, sub, isCurriculum) => {
    const queryParams = {}
    if (typeof tab === 'string') queryParams.tab = tab
    if (typeof sub === 'string') queryParams.sub = sub
    // if (typeof target === 'string') queryParams.target = target
    const finalQp = toQueryParams(queryParams)
    return `/editors/unit/${unitId}${finalQp}`
  },
  triggersEnter: () => [loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/editors/unit/unitEditor')
  },
  target: null,
  template: 'unitEditor',
  label: 'editor.unit.title',
  roles: null,
  data: null
}

TeacherRoutes.taskEditor = {
  path: (taskId = ':taskId', unitId) => typeof unitId === 'string'
    ? `/editors/task/${taskId}?unit=${unitId}`
    : `/editors/task/${taskId}`,
  triggersEnter: () => [loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/editors/task/taskEditor')
  },
  target: null,
  template: 'taskEditor',
  label: 'editor.task.title',
  roles: null,
  data: null
}

TeacherRoutes.unitWizard = {
  path: () => '/wizards/unit/',
  triggersEnter: () => [loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/wizards/unit/unitWizard')
  },
  target: null,
  template: 'unitWizard',
  label: 'wizard.unit.title',
  roles: null,
  data: null
}

TeacherRoutes.taskWizard = {
  path: () => '/wizards/task/',
  triggersEnter: () => [loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/wizards/task/taskWizard')
  },
  target: null,
  template: 'taskWizard',
  label: 'wizard.task.title',
  roles: null,
  data: null
}

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// TEACHING / LESSON
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

TeacherRoutes.lesson = {
  path: (lessonId = ':lessonId') => `/lessons/${lessonId}`,
  triggersEnter: () => [leaveCurriculum, loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/pages/lesson/lesson')
  },
  target: null,
  template: 'lesson',
  label: 'lesson.title',
  roles: null,
  data: null
}

// ///////////////////////////////////
// PRESENT
// ///////////////////////////////////

TeacherRoutes.present = {
  path: () => '/present',
  triggersEnter: () => [leaveCurriculum, loginTrigger, studentTrigger],
  async load () {
    return import('../../../ui/pages/present/present')
  },
  target: 'beamerContainer',
  roles: null,
  template: 'present',
  label: 'beamer.title',
  data: {}
}
