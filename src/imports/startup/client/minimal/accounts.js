import { Accounts } from 'meteor/accounts-base'
import { Routes } from '../../../api/routes/Routes'
import { Router } from '../../../api/routes/Router'

// FIX re-login bug
Accounts.onLogout(function () {
  setTimeout(() => Router.go(Routes.login), 50)
  setTimeout(() => window.location.reload({ forceReload: true }))
})
