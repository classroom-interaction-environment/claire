import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'

export const AdminViewStates = {
  users: {
    name: 'users',
    role: UserUtils.roles.schoolAdmin,
    label: 'admin.users.title',
    template: 'adminUsers',
    load: async function () {
      return import('./views/users/users')
    }
  },
  settings: {
    name: 'settings',
    role: UserUtils.roles.admin,
    label: 'admin.settings.title',
    template: 'adminSettings',
    load: async function () {
      return import('./views/settings/settings')
    }
  },
  stats: {
    name: 'stats',
    role: UserUtils.roles.admin,
    label: 'admin.stats.title',
    template: 'adminStats',
    load: async function () {
      return import('./views/stats/stats')
    }
  },
  logs: {
    name: 'logs',
    role: UserUtils.roles.schoolAdmin,
    label: 'admin.logs.title',
    template: 'adminLogs',
    load: async function () {
      return import('./views/log/log')
    }
  }
}
