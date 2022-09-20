import { Tracker } from 'meteor/tracker'
import { Schema } from '../../../api/schema/Schema'
import { Fields } from '../../../api/fields/Fields'
import { Defaults } from '../../../api/defaults/Defaults'

Schema.extendOptions(Defaults.schemaOptions())

// DEFAULT SCHEMA
Schema.setDefault(Defaults.schema())

// DEFAULT PUBLIC FIELDS
Fields.setDefault(Defaults.fields())

Schema.setDefaultOptions({
  tracker: Tracker
})
