// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by item-range.js.
import { name as packageName } from "meteor/claire:item-range";

// Write your tests here!
// Here is an example.
Tinytest.add('item-range - example', function (test) {
  test.equal(packageName, "item-range");
});
