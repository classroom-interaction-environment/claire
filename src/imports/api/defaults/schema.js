import { Meteor } from 'meteor/meteor'
import { i18n } from '../language/language'

export const DefaultSchema = {}

/**
 * @private Indicates the last timestamp of edits.
 */
DefaultSchema.updatedAt = {
  type: Date,
  optional: true,
  label: i18n.reactive('common.updatedAt'),
  autoform: {
    type: 'hidden'
  },
  resolve (value) {
    return new Date(value).toLocaleString()
  }
}

/**
 *  Indicates the person who was the last editor of the document.
 */
DefaultSchema.updatedBy = {
  type: String,
  optional: true,
  label: i18n.reactive('common.updatedBy'),
  max: 17,
  autoform: {
    type: 'hidden'
  },
  resolve (value) {
    const user = Meteor.users.findOne(value)
    return (user && user.username) || value
  }
}

/**
 *  Indicating the time of creation of the document. Can't be overridden.
 */
DefaultSchema.createdAt = {
  type: Date,
  optional: true,
  label: i18n.reactive('common.createdAt'),
  autoform: {
    type: 'hidden'
  },
  resolve (value) {
    return new Date(value).toLocaleString()
  }
}

/**
 *  Indicating the originator of the document. Can't be overridden.
 */
DefaultSchema.createdBy = {
  type: String,
  optional: true,
  label: i18n.reactive('common.createdBy'),
  max: 17,
  autoform: {
    type: 'hidden'
  },
  resolve (value) {
    const user = Meteor.users.findOne(value)
    return (user && user.username) || value
  }
}

/**
 *  The _master flag is defined for all documents, that have been synchronized from the curriculum collection.
 */
DefaultSchema._master = {
  type: Boolean,
  optional: true,
  autoform: { type: 'hidden' },
  label: 'curriculum.masterDoc'
}

/**
 *  The _original field is defined for local copies of _master documents in order to identify a _master-clone
 * relation for publications, filtering, deleting etc.
 */
DefaultSchema._original = {
  type: String,
  optional: true,
  autoform: { type: 'hidden' },
  label: 'curriculum.originalDoc'
}

/**
 * The _custom field is defined for documents that are entirely related to it's creating user but are not
 * necessarily limited to any master or original document.
 * This can involve: custom units, global material, global phases etc.
 */
DefaultSchema._custom = {
  type: Boolean,
  optional: true,
  autoform: { type: 'hidden' },
  label: 'curriculum.custom'
}

/**
 * The _archivedAt field is used to soft-delete files, that will not be shown to users anymore.
 * The presence of the field indicates the status, while the Date value indicates when it has been archived.
 */
DefaultSchema._archivedAt = {
  type: Date,
  optional: true,
  autoform: { type: 'hidden' },
  label: 'defaults.archivedAt'
}

DefaultSchema._shared = {
  type: Array,
  optional: true,
  autoform: { type: 'hidden' },
  label: 'defaults.shared'
}

DefaultSchema['_shared.$'] = {
  type: String
}

const DefaultFields = {}

// create a default field key for every schema field
Object.keys(DefaultSchema).forEach(key => !key.includes('.') && Object.defineProperty(DefaultFields, key, {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: false
}))

export { DefaultFields }
