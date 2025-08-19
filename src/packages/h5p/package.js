/* eslint-env meteor */
Package.describe({
  name: 'claire:h5p',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom('2.7.3')
  api.use('ecmascript')
  api.mainModule('h5p-server.js', 'server')
  api.mainModule('h5p-client.js', 'client')
})

Package.onTest(function (api) {
  api.use('ecmascript')
  api.use('tinytest')
  api.use('claire:h5p')
  api.mainModule('h5p-tests.js')
})
