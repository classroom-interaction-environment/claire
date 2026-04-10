Package.describe({
  name: 'mdg:validated-method',
  summary: 'A simple wrapper for Meteor.methods',
  version: '1.3.0',
  documentation: 'README.md',
});

Package.onUse(function (api) {
  api.versionsFrom(['1.7', '2.3', '3.0']);

  api.use([
    'ecmascript',
    'check',
    'ddp',
  ]);

  api.mainModule('validated-method.js');
  api.export('ValidatedMethod');
});

Package.onTest(function (api) {
  Npm.depends({ chai: '4.3.7' })
  api.use([
    'ecmascript',
    'meteortesting:mocha@3.0.0',
    'aldeed:simple-schema@2.0.0',
    'mdg:validated-method',
    'random',
    'check'
  ]);

  api.mainModule('validated-method-tests.js');
});
