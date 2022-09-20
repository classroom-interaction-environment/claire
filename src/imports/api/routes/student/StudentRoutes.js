import { Router } from '../Router'
import { BackRoute } from '../../../ui/controllers/student/BackRoute'
import { Routes } from '../Routes'
import { createLoginTrigger } from '../triggers/createLoginTrigger'
import { Features } from '../../config/Features'

export const StudentRoutes = {}

const loginTrigger = createLoginTrigger(Routes.login)

StudentRoutes.root = {
  path: () => '/',
  triggersEnter: () => [loginTrigger],
  load () {
    BackRoute.flush()
    return import('../../../ui/pages/student/lessons/lessons')
  },
  target: null,
  label: 'routes.lessons',
  template: 'lessons',
  roles: null,
  data: null
}

StudentRoutes.profile = {
  path: (userId = ':userId', status) => {
    const base = `/profile/${userId}`
    if (typeof status !== 'string') return base

    return `${base}?status=${status}`
  },
  triggersEnter: () => [loginTrigger],
  async load () {
    return import('../../../ui/pages/profile/profile')
  },
  target: null,
  label: 'routes.profile',
  template: 'userProfile',
  roles: null,
  data: null
}

// ////////////////////////////////////////////////////////////////////////////
//
//  GROUP SCOPE
//
// ////////////////////////////////////////////////////////////////////////////

if (Features.get('groups')) {
  StudentRoutes.group = {
    path: (lessonId = ':lessonId', groupId = ':groupId') => {
      return `/lessons/${lessonId}/group/${groupId}`
    },
    triggersEnter: () => [loginTrigger],
    async load () {
      return import('../../../ui/pages/student/group/group')
    },
    target: null,
    label: 'routes.group',
    template: 'studentGroup',
    roles: null,
    data: null,
    onAction (params, queryParams) {
      const current = Router.current()
      const path = StudentRoutes.lesson.path(current.params.lessonId)
      const title = StudentRoutes.lesson.label
      BackRoute.set({ path, title })
      BackRoute.cache({ path: current.path, title: StudentRoutes.group.label })
    }
  }
}

// ////////////////////////////////////////////////////////////////////////////
//
//  LESSON SCOPE
//
// ////////////////////////////////////////////////////////////////////////////

StudentRoutes.lesson = {
  path: (lessonId = ':lessonId') => `/lessons/${lessonId}`,
  triggersEnter: () => [loginTrigger],
  async load () {
    return import('../../../ui/pages/student/lesson/lesson')
  },
  target: null,
  template: 'lesson',
  label: 'lesson.title',
  roles: null,
  data: null,
  onAction (/* params, queryParams */) {
    BackRoute.flush()
    const current = Router.current()
    const path = StudentRoutes.root.path()
    const title = StudentRoutes.root.label
    BackRoute.set({ path, title })
    BackRoute.cache({ path: current.path, title: StudentRoutes.lesson.label })
  }
}

StudentRoutes.Files = {
  path: (lessonId = ':lessonId', type = ':type', fileId = ':fileId', groupId = ':groupId') => {
      return `/lessons/${lessonId}/group/${groupId}/files/${type}/${fileId}`
  },
  triggersEnter: () => [loginTrigger],
  async load () {
    return import('../../../ui/pages/student/material/files/files')
  },
  target: null,
  template: 'files',
  label: 'files.title',
  roles: null,
  data: null,
  onAction (/* params, queryParams */) {
    const current = Router.current()
    BackRoute.set(getMaterialBackgroute(current))
    BackRoute.cache({ path: current.path, title: StudentRoutes.Files.label })
  }
}

StudentRoutes.webresources = {
  path: (lessonId = ':lessonId', type = ':type', mediaId = ':mediaId', groupId = ':groupId') => {
    return `/lessons/${lessonId}/group/${groupId}/web-resources/${type}/${mediaId}`
  },
  triggersEnter: () => [loginTrigger],
  async load () {
    return import('../../../ui/pages/student/material/media/media')
  },
  target: null,
  template: 'media',
  label: 'webResources.title',
  roles: null,
  data: null,
  onAction (/* params, queryParams */) {
    const current = Router.current()
    BackRoute.set(getMaterialBackgroute(current))
    BackRoute.cache({ path: current.path, title: StudentRoutes.webresources.label })
  }
}

StudentRoutes.task = {
  path: (lessonId = ':lessonId', type = ':type', taskId = ':taskId', groupId = ':groupId') => {
    return `/lessons/${lessonId}/group/${groupId}/${type}/${taskId}`
  },
  triggersEnter: () => [loginTrigger],
  async load () {
    return import('../../../ui/pages/student/material/task/task')
  },
  target: null,
  template: 'task',
  label: 'task.title',
  roles: null,
  data: null,
  onAction (params, queryParams) {
    const current = Router.current()
    BackRoute.set(getMaterialBackgroute(current))
    BackRoute.cache({ path: current.path, title: StudentRoutes.task.label })
  }
}

const getMaterialBackgroute = ({ params }) => {
  const hasGroup = params.groupId && params.groupId !== 'none'
  const path = hasGroup
    ? StudentRoutes.group.path(params.lessonId, params.groupId)
    : StudentRoutes.lesson.path(params.lessonId)
  const title = hasGroup
    ? StudentRoutes.group.label
    : StudentRoutes.lesson.label
  return { path, title }
}
