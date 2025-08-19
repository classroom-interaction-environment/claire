import { cspOptions } from '../../../api/csp/cspOptions'
import { WebApp } from 'meteor/webapp'
import helmet from 'helmet'

/*
 * This sets up a default content security policy that also conforms with
 * the client bundle structure.
 *
 * TODO: read extended CSP options from installed plugins
 */
const externalHostUrls = [
  'https://h5p.org'
]

WebApp.connectHandlers.use(helmet(cspOptions(externalHostUrls)))
