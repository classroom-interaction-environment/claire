/* eslint-env meteor */
Package.describe({
  name: 'claire:item-textarea',
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
  api.use('ecmascript')
  api.use('claire:plugin-registry')
  api.addFiles('item-textarea.js')
})

Package.onTest(function (api) {
  api.use('ecmascript')
  api.use('tinytest')
  api.use('claire:item-textarea')
  api.mainModule('item-textarea-tests.js')
})
