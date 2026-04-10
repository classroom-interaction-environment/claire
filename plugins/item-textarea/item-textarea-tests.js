// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest'

// Import and rename a variable exported by item-textarea.js.
import { name as packageName } from 'meteor/claire:item-textarea'

// Write your tests here!
// Here is an example.
Tinytest.add('item-textarea - example', function (test) {
  test.equal(packageName, 'item-textarea')
})
