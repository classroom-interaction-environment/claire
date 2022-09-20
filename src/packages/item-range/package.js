Package.describe({
  name: 'claire:item-range',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Npm.depends({
  nouislider: '14.6.3'
})

Package.onUse(function (api) {
  //api.versionsFrom('1.6')
  api.use('ecmascript')
  api.use('claire:plugin-registry')
  api.use('muqube:autoform-nouislider')
  api.addFiles('item-range.js')
})

Package.onTest(function (api) {
  api.use('ecmascript')
  api.use('tinytest')
  api.use('claire:item-range')
  api.mainModule('item-range-tests.js')
})
