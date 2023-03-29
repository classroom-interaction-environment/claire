import {config, methods, collections, i18n, routesHandler} from 'meteor/claire:h5p'
import {createMethod} from '../../../infrastructure/factories/createMethod'
import {rateLimitMethod} from '../../../infrastructure/factories/rateLimit'
import {createCollection} from '../../../infrastructure/factories/createCollection'
import {WebApp} from 'meteor/webapp'
import bodyParser from 'body-parser'
import {Meteor} from 'meteor/meteor'
import { i18n as i18nProvider } from '../../../api/language/language'
import h5pConfig from './h5pConfig.json'

collections(createCollection)

methods(definition => {
  createMethod(definition)
  rateLimitMethod(definition)
})

i18n({
  addl10n: i18nProvider.addl10n,
  translate: (key, language) => i18nProvider.get(language, key),
  getLocale: i18nProvider.getLocale,
})

config(h5pConfig)

Meteor.startup(async () => {
  WebApp.connectHandlers.use(bodyParser.json({ limit: '500mb' }))
  WebApp.connectHandlers.use(
    bodyParser.urlencoded({
      extended: true
    })
  )
  WebApp.connectHandlers.use('/h5p', routesHandler())
})

