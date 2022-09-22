import { Meteor } from 'meteor/meteor'
import { Router } from './Router'
import { CodeInvitation } from '../../contexts/classroom/invitations/CodeInvitations'
import { createLoggedinTrigger } from './triggers/createLoggedinTrigger'
import { createToRoute } from './createToRoute'
import { resolveRedirect } from './getResolveRedirect'

/**
 * This defines the minimal set of routes, that are available either for
 * non-logged in users and/or for logged-in users, independent of their role.
 */
export const Routes = {}

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// PUBLIC ROUTES
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

let loggedInTrigger
let loginTrigger
let toCodeRegisterRoute
let toNotFoundRoute
let toLoginRoute
const baseUrl = Meteor.absoluteUrl().slice(0, -1)

Routes.fallback = {
  path: () => '*',
  label: 'routes.notFound',
  triggersEnter: () => [function (context) {
    if (context.params && context.params[0] && context.params[0].length === 5) {
      const code = context.params[0].substr(1, context.params[0].length)
      // todo extract CodeInvitation and load dynamically when required
      const queryParams = CodeInvitation.helpers.createURLQuery({ code })
      return toCodeRegisterRoute(queryParams)
    }

    // logged-in-users will get a 404/not-found
    if (Meteor.userId()) {
      return toNotFoundRoute(window.location.href.replace(baseUrl, ''))
    }

    // set redirect URL and go to login
    const location = Router.location()
    return toLoginRoute(encodeURIComponent(location))
  }],
  load () {
  },
  template: 'notFound',
  roles: null,
  data: null
}

Routes.legal = {
  path: (type = ':type') => `/legal/${type}`,
  label: 'legal.title',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/legal/legal')
  },
  template: 'legal',
  roles: null,
  data: null
}

Routes.notFound = {
  path: (redirect) => {
    if (redirect) {
      return `/notfound?redirect=${encodeURIComponent(redirect)}`
    }
    return '/notfound'
  },
  label: 'routes.notFound',
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/notfound/notFound')
  },
  template: 'notFound',
  roles: null,
  data: null
}

Routes.forbidden = {
  path: () => '/forbidden',
  triggersEnter: () => [],
  label: 'errors.403',
  async load () {
    return import('../../ui/pages/forbidden/forbidden')
  },
  template: 'forbidden',
  roles: null,
  data: null
}

Routes.login = {
  path: (redirect) => {
    return redirect && redirect !== '%2F'
      ? `/login?redirect=${redirect}`
      : '/login'
  },
  triggersEnter: () => [loggedInTrigger],
  load () {
    return require('../../ui/pages/login/login')
  },
  label: 'routes.login',
  template: 'login',
  roles: null,
  data: {
    onSuccess (redirect) {
      Router.go(redirect || Routes.root)
    }
  }
}

Routes.logout = {
  path: () => {
    return '/logout'
  },
  triggersEnter: () => [loginTrigger],
  load () {
    return require('../../ui/pages/logout/logout')
  },
  label: 'routes.logout',
  template: 'logout',
  roles: null,
  data: {
    onSuccess () {
      Router.go(Routes.login)
    }
  }
}

Routes.codeRegister = {
  path: (queryParams) => queryParams ? `/register?qp=${queryParams}` : '/register',
  label: 'codeRegister.title',
  template: 'codeRegister',
  description: 'codeRegister.description',
  target: null,
  roles: null,
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/register/code/codeRegister')
  },
  data: {
    onSuccess ({ username, password }) {
      Meteor.loginWithPassword(username, password, function (err) {
        if (err) {
          Router.go(Routes.login)
        } else {
          Router.go(Routes.root)
        }
      })
    }
  }
}

Routes.verifyEmail = {
  path: (verificationToken = ':verificationToken') => `/verify-email/${verificationToken}`,
  label: 'user.verifyEmail.title',
  template: 'verifyEmail',
  description: 'user.verifyEmail.description',
  target: null,
  roles: null,
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/register/verify/verifyEmail')
  },
  data: {
    onComplete () {
      Router.go(Routes.root)
    }
  }
}

Routes.enrollAccount = {
  path: (verificationToken = ':verificationToken') => `/enroll-account/${verificationToken}`,
  label: 'user.enrollAccount.title',
  template: 'enrollAccount',
  description: 'user.enrollAccount.description',
  target: null,
  roles: null,
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/register/enroll/enrollAccount')
  },
  data: {
    onComplete ({ userId }) {
      const path = Routes.profile.path(userId, 'new')
      Router.go(path)
    }
  }
}

Routes.resetPassword = {
  path: (token = ':token') => `/reset-password/${token}`,
  label: 'login.resetPassword.title',
  template: 'resetPassword',
  description: null,
  target: null,
  roles: null,
  triggersEnter: () => [],
  async load () {
    return import('../../ui/pages/register/reset/resetPassword')
  },
  data: {
    onComplete () {
      Router.go(Routes.root)
    }
  }
}

// ////////////////////////////////////////////////////////////////////////////////////////////////
//
// AUTHENTICATED ROUTES
//
// ////////////////////////////////////////////////////////////////////////////////////////////////

Routes.profile = {
  path: (userId = ':userId', status) => {
    const base = `/profile/${userId}`
    if (typeof status !== 'string') return base
    return `${base}?status=${status}`
  },
  triggersEnter: () => [loginTrigger],
  async load () {
    return import('../../ui/pages/profile/profile')
  },
  target: null,
  label: 'routes.profile',
  template: 'userProfile',
  roles: null,
  data: null
}

Routes.confirmResearch = {
  path: (data = ':data') => `/confirm-research/${data}`,
  triggersEnter: () => [loginTrigger],
  async load () {
    return import('../../ui/pages/register/research/confirmResearch')
  },
  target: null,
  label: 'user.research.participate',
  template: 'confirmResearch',
  roles: null,
  data: null
}

// assign object keys as part
// of the routes for translation
Object.keys(Routes).forEach(routeKey => {
  Routes[routeKey].key = routeKey
})

// create default goto actions
loginTrigger = function () {
  if (!Meteor.userId()) {
    // set redirect URL and go to login
    return toLoginRoute()
  }
}
loggedInTrigger = createLoggedinTrigger(() => resolveRedirect() || Routes.root.path())
toCodeRegisterRoute = createToRoute(Routes.codeRegister)
toNotFoundRoute = createToRoute(Routes.notFound)
toLoginRoute = createToRoute(Routes.login)
