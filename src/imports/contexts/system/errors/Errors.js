import { Meteor } from 'meteor/meteor'
import { i18n } from '../../../api/language/language'
import { getCollection } from '../../../api/utils/getCollection'
import { onServer } from '../../../api/utils/archUtils'

let _collection

export const Errors = {
  name: 'errors',
  label: 'errorLog.title',
  icon: 'exclamation-triangle',
  collection () {
    if (!_collection) {
      _collection = getCollection(Errors.name)
    }
    return _collection
  },
  schema: {
    source: {
      type: String,
      optional: true
    },
    name: String,
    type: String,
    message: String,
    stack: String,
    details: {
      type: String,
      optional: true
    },
    history: {
      type: Array
    },
    'history.$': {
      type: Object
    },

    'history.$.createdBy': {
      type: String,
      optional: true,
      label: () => i18n.get('common.createdBy'),
      autoform: {
        type: 'hidden'
      },
      resolve (value) {
        const user = Meteor.users.findOne(value)
        return (user && user.username) || value
      }
    },
    'history.$.createdAt': {
      type: Date,
      optional: true,
      label: () => i18n.get('common.createdAt'),
      autoform: {
        type: 'hidden'
      },
      resolve (value) {
        return new Date(value).toLocaleString()
      }
    },
    isMethod: Boolean,
    isPublication: Boolean,
    isServer: Boolean,
    isClient: Boolean
  },
  filter: {
    schema: {
      before: {
        type: Date,
        label: () => i18n.get('errors.createdBefore'),
        defaultValue: () => new Date(),
        optional: true
      },
      userId: {
        type: String,
        label: () => i18n.get('errors.createdBy'),
        optional: true,
        autoform: {
          firstOption: () => i18n.get('errors.byAllUsers'),
          options: () => Meteor.users.find().map(user => ({ value: user._id, label: user.username }))
        }
      },
      limit: {
        type: Number,
        label: () => i18n.get('errors.logLimit'),
        optional: true,
        min: 1,
        max: 250,
        defaultValue: 1
      }
    }
  },
  dependencies: []
}

Errors.publications = {
  byDate: {
    name: 'errors.publication.byDate',
    isAdmin: true,
    schema: {
      createdAt: {
        type: Date,
        optional: true
      },
      limit: {
        type: Number,
        optional: true,
        max: 250
      }
    },
    run: onServer(function ({ limit }) {
      let projectionLimit
      if (limit && limit <= 100) {
        projectionLimit = limit
      }
      else {
        projectionLimit = 1
      }
      // we return a limited amount of docs
      // and scan backward, since errors are
      // added in a linear temporal fashion
      // so no need for costly sort operations
      const projection = {
        fields: {},
        limit: projectionLimit,
        hint: { $natural: -1 }
      }

      const query = {}
      return Errors.collection().find(query, projection)
    })
  }
}

Errors.methods = {
  logClient: {
    name: 'error.methods.logClient',
    schema: Errors.schema,
    run: onServer(function (errDoc) {
      const ErrorsCollection = getCollection(Errors.name)
      errDoc.isClient = true
      errDoc.isServer = false
      errDoc.isMethod = false
      errDoc.isPublication = false
      return ErrorsCollection.insert(errDoc)
    })
  }
  // TODO getLogCount
  // TODO cleanLog
}
