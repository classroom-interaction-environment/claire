// ////////////////////////////////////////////////////////////////////////////
//
// A Connect router implementing all routes needed for H5P.
//
// ////////////////////////////////////////////////////////////////////////////
import { Meteor } from 'meteor/meteor'
import Router from 'router'
import { H5PAjaxEndpoint } from '@lumieducation/h5p-server'
import { Cookies } from 'meteor/ostrio:cookies'
import { catchAndPassOnErrors } from './catchAndPassOnErrors'
import { errorHandler } from './connectErrorHandler'
import { H5PMeteor } from '../H5PMeteor'
import { getUser } from './getUser'
import { createLog } from '../../../../imports/api/log/createLog'

const log = createLog({ name: 'H5P', type: 'debug' })

// ////////////////////////////////////////////////////////////////////////////
//
// Upload handling
//
// ////////////////////////////////////////////////////////////////////////////

// Deliberately left unused, so that cookies work in the request.
;(() => new Cookies())()

// ////////////////////////////////////////////////////////////////////////////
//
// Route export
//
// ////////////////////////////////////////////////////////////////////////////

export const h5pConnectHandler = (h5pEditor) => {
  const ajaxEndpoint = new H5PAjaxEndpoint(h5pEditor)
  const router = new Router()

  // before any route we resolve the current user by x_mtok cookie
  router.use(getUser)

  // here we iterate all defined routes in the H5PMeteor
  // Object and create a route, based on each' definition.
  // We also inject the `ajaxEndpoint`,
  // instead of creating one each time.

  Object.values(H5PMeteor.routes).forEach(({ name, method, permissions, middleware = [], run }) => {
    log('create route for:', method, name)
    const allPermissions = permissions && Object.keys(permissions)
    const createHandler = router[method]
    if (!createHandler) {
      throw new Error(`No HTTP method defined for ${name}/${method}`)
    }
    const fn = run(ajaxEndpoint)
    const handler = async function (req, res, next) {
      if (!req.userId || !req.user) {
        throw new Meteor.Error('permissionDenied', 'notLoggedIn')
      }
      if (allPermissions?.length) {
        const user = req.user()
        if (!user || !allPermissions.every(permission => !!user?.privileges?.[permission])) {
          throw new Meteor.Error('permissionDenied', 'insufficientPrivileges')
        }
      }
      return await fn(req, res, next)
    }

    if (typeof handler !== 'function') {
      throw new Error(`No handler resolved for ${name}/${method}`)
    }

    // if we have any middleware before our route handler
    // we create an array and spread it to the route
    if (middleware.length > 0) {
      const allMiddleware = Array.isArray(middleware)
        ? middleware
        : [middleware]
      allMiddleware.push(catchAndPassOnErrors({ name, method, handler, handleErrors: true }))
      return createHandler.call(router, name, ...allMiddleware)
    }

    createHandler.call(router, name, catchAndPassOnErrors({ name, method, handler, handleErrors: true }))
  })

  /**
   * The error handler localizes error messages.
   */
  router.use(errorHandler('auto'))

  return router
}
