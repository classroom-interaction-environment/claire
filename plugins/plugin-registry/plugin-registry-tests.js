// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest'

// Import and rename a variable exported by plugin-registry.js.
import { name as packageName } from 'meteor/claire:plugin-registry'

// Write your tests here!
// Here is an example.
Tinytest.add('plugin-registry - example', function (test) {
  test.equal(packageName, 'plugin-registry')
})
