import { Routes } from '../Routes'
import { createAdminTrigger } from '../triggers/createAdminTrigger'

export const AdminRoutes = {}

export const adminTrigger = createAdminTrigger({
  redirectRoute: Routes.login,
  forbiddenRoute: Routes.forbidden
})

AdminRoutes.admin = {
  path: () => '/admin',
  triggersEnter: () => [adminTrigger],
  async load () {
    return import('../../../ui/pages/admin/admin')
  },
  target: null,
  template: 'admin',
  label: 'admin.title',
  roles: null,
  data: null
}
