import { WebApp } from 'meteor/webapp'
import { cspOptions } from '../../../api/csp/cspOptions'
import helmet from 'helmet'

/*
 * This sets up a default content security policy that also conforms with
 * the client bundle structure.
 *
 * TODO: read extended CSP options from installed plugins
 */

// Within server side Meter.startup()
WebApp.connectHandlers.use(helmet(cspOptions()))
