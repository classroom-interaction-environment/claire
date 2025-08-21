import { Meteor } from 'meteor/meteor'
import meteorSettingsSchema from '../../../../.settings-schema'
import { Schema, Integer, RegEx } from '../../../api/schema/Schema'

/*
 * This ensures the settings env file (usually settings.json)
 * conforms the given schema.
 *
 * Note that the schema is outside the project folder scope, because
 * it can also be used by deployment tools (like MUP) in order to validate
 * the deployment/production settings before building/deploying a release.
 */
const settingsSchema = meteorSettingsSchema({ factory: (schema) => Schema.create(schema), Integer, RegEx })
settingsSchema.validate(Meteor.settings)
