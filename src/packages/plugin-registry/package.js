/* eslint-env meteor */
Package.describe({
  name: 'claire:plugin-registry',
  version: '1.0.0',
  summary: 'Base package to register plugins for CLAIRE',
  git: '',
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.use('ecmascript')
  api.mainModule('plugin-registry.js')
})

Package.onTest(function (api) {
  api.use('ecmascript')
  api.use('tinytest')
  api.use('claire:plugin-registry')
  api.mainModule('plugin-registry-tests.js')
})
