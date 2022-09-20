import SimpleSchema from 'simpl-schema'
import { Schema } from '../../../api/schema/Schema'
import { Fields } from '../../../api/fields/Fields'
import { Defaults } from '../../../api/defaults/Defaults'

/**
 * Initializes all field-level defaults that are required for validating
 * documents before any database operation, as well as which fields to
 * publish by default for all documents.
 *
 * These apply for all documents and contain the most minimal required field
 * information.
 */

Schema.extendOptions(Defaults.schemaOptions())

// DEFAULT SCHEMA
Schema.setDefault(Defaults.schema())

// DEFAULT PUBLIC FIELDS
Fields.setDefault(Defaults.fields())
