import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

/*
 * due to unclean programming this collection has accidentally been named
 * 'imagefiles', violating the camelCase convention which introduced certain
 * follow-up errors when resolving context namespaces
 */

if (Meteor.settings.patch?.imageFiles) {
	const imageFiles = new Mongo.Collection("imagefiles");
	const rawCollection = imageFiles.rawCollection();

	if ((await imageFiles.countDocuments({})) > 0) {
		rawCollection.rename("imageFiles");
	}

	rawCollection.drop();
}
