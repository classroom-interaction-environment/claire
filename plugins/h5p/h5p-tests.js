// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest'

// Import and rename a variable exported by h5p.js.
import { name as packageName } from 'meteor/leaonline:h5p'

// Write your tests here!
// Here is an example.
Tinytest.add('h5p - example', function (test) {
  test.equal(packageName, 'h5p')
})
