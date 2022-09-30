/* global __meteor_runtime_config__ */
import { Meteor } from 'meteor/meteor'
import crypto from 'crypto'
import { WebApp } from 'meteor/webapp'
import { Autoupdate } from 'meteor/autoupdate'
import { check } from "meteor/check"

const self = '\'self\''
const data = 'data:'
const blob = 'blob:'
const unsafeEval = '\'unsafe-eval\''
const unsafeInline = '\'unsafe-inline\''

export function cspOptions (externalHostUrls = []) {
  // get the default connect source for our current domain
  const { usesHttps, connectSrc } = getConnectSrc(Meteor.absoluteUrl())

  // Prepare runtime config for generating the sha256 hash
  // It is important, that the hash meets exactly the hash of the
  // script in the client bundle.
  // Otherwise the app would not be able to start, since the runtimeConfigScript
  // is rejected __meteor_runtime_config__ is not available, causing
  // a cascade of follow-up errors.
  const hashes = [true, false].map(isModern => {
    const runtimeConfig = Object.assign(__meteor_runtime_config__, Autoupdate, {
      accountsConfigCalled: true, // this may depend on, whether you called Accounts.config
      isModern: isModern
    })

    // add client versions to __meteor_runtime_config__
    Object.keys(WebApp.clientPrograms).forEach(arch => {
      __meteor_runtime_config__.versions[arch] = {
        version: Autoupdate.autoupdateVersion || WebApp.clientPrograms[arch].version(),
        versionRefreshable: Autoupdate.autoupdateVersion || WebApp.clientPrograms[arch].versionRefreshable(),
        versionNonRefreshable: Autoupdate.autoupdateVersion || WebApp.clientPrograms[arch].versionNonRefreshable(),
        // comment the following line if you use Meteor < 2.0
        versionReplaceable: Autoupdate.autoupdateVersion || WebApp.clientPrograms[arch].versionReplaceable()
      }
    })

    const runtimeConfigScript = `__meteor_runtime_config__ = JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(runtimeConfig))}"))`
    return crypto.createHash('sha256').update(runtimeConfigScript).digest('base64')
  })

  const opt = {
    crossOriginEmbedderPolicy: false,
    //crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy:  { policy: "cross-origin" },
    contentSecurityPolicy: {
      blockAllMixedContent: true,
      directives: {
        defaultSrc: [self],
        scriptSrc: [
          self,
          // Remove / comment out unsafeEval if you do not use dynamic imports
          // to tighten security. However, if you use dynamic imports this line
          // must be kept in order to make them work.
          unsafeEval,
          `'sha256-${hashes[0]}'`,
          `'sha256-${hashes[1]}'`
        ],
        childSrc: [self],
        // If you have external apps, that should be allowed as sources for
        // connections or images, your should add them here
        // Call helmetOptions() without args if you have no external sources
        // Note, that this is just an example and you may configure this to your needs
        connectSrc: connectSrc.concat(externalHostUrls),
        fontSrc: [self, data],
        formAction: [self],
        frameAncestors: [self],
        frameSrc: ['*'],
        // This is an example to show, that we can define to show images only
        // from our self, browser data/blob and a defined set of hosts.
        // Configure to your needs.
        imgSrc: [self, data, blob].concat(externalHostUrls),
        manifestSrc: [self],
        mediaSrc: [self],
        objectSrc: [self],
        // these are just examples, configure to your needs, see
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/sandbox
        sandbox: [
          // allow-downloads-without-user-activation // experimental
          'allow-same-origin',
          'allow-downloads',
          'allow-orientation-lock',
          'allow-pointer-lock',
          'allow-popups',
          'allow-popups-to-escape-sandbox',
          'allow-scripts',
          'allow-forms',
          'allow-modals',
          'allow-presentation',
          //'allow-top-navigation',
          // 'allow-storage-access-by-user-activation ', // experimental
          // 'allow-top-navigation',
          // 'allow-top-navigation-by-user-activation'
        ],
        styleSrc: [self, unsafeInline],
        workerSrc: [self, blob]
      }
    },
    strictTransportSecurity: {
      maxAge: 15552000,
      includeSubDomains: true,
      preload: false
    },
    referrerPolicy: {
      policy: 'no-referrer'
    },
    expectCt: {
      enforce: true,
      maxAge: 604800
    },
    frameguard: {
      action: 'sameorigin'
    },
    dnsPrefetchControl: {
      allow: false
    },
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },
    hidePoweredBy: true
  }

  // We assume, that we are working on a localhost when there is no https
  // connection available.
  // Run your project with --production flag to simulate script-src hashing
  if (!usesHttps && Meteor.isDevelopment) {
    delete opt.contentSecurityPolicy.directives.blockAllMixedContent
    opt.contentSecurityPolicy.directives.scriptSrc = [self, unsafeEval, unsafeInline]
  }

  return opt
}


/** @private Transforms a given url to a valid connect-src */
const getConnectSrc = url => {
  check(url, String)
  const domain = url.replace(/http(s)*:\/\//, '').replace(/\/$/, '')
  const s = url.match(/(?!=http)s(?=:\/\/)/) ? 's' : ''
  const usesHttps = s.length > 0
  const connectSrc = [
    self,
    `http${s}://${domain}`,
    `ws${s}://${domain}`
  ]

  return { domain, usesHttps, connectSrc }
}
