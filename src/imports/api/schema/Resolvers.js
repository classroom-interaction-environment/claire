/* eslint-env meteor */
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

/** @deprecated **/
export const DisplayTypes = {
  string: 'string',
  array: 'array',
  icon: 'icon',
  user: 'user',
  object: 'object',
  number: 'number',
  document: 'document'
}

/** @deprecated **/
export const Resolvers = {

  booleanToIcon (value) {
    return value ? 'check' : 'false'
  },

  userName (userId) {
    const user = Meteor.users.findOne(userId)
    if (!user) {
      return userId
    }
    return user.username
  },

  userFullName (userId) {
    const user = Meteor.users.findOne(userId)
    if (!user) {
      return userId
    }
    const { firstName } = user
    const { lastName } = user
    return { firstName, lastName }
  },

  user (userId) {
    const user = Meteor.users.findOne(userId, {})
    if (!user) {
      return userId
    }
    return user
  },

  roles (roleName) {
    return `roles.${roleName}`
  },

  resolveArray ({ resolve = el => el, sort = () => {}, elementType, elementKey } = {}) {
    return arrayVal => {
      if (!arrayVal || arrayVal.length === 0) {
        return []
      }

      return arrayVal
        .map(resolve)
        .map(resolvedElement => ({
          value: resolvedElement,
          type: elementType,
          key: elementKey
        }))
        .sort(sort)
    }
  },

  sortByName (a, b) {
    const c = (a && a.lastName) || ''
    const d = (b && b.lastName) || ''
    return c.localeCompare(d)
  },

  documentResolver ({ collection, labelField = 'title' }) {
    return function resolveDocument (docId) {
      const DocCollection = Mongo.Collection.get(collection)
      const document = DocCollection.findOne(docId)
      if (!document) return docId
      return { docId: document._id, collection, label: document[labelField] }
    }
  },

  // ////////////////////////////////////////////////

  resolveFieldValue (key, value, referenceSchema) {
    if (!key) return { type: String, value: null }

    if (!referenceSchema) {
      return value
    }
    const schemaEntry = referenceSchema[key]
    if (!schemaEntry) {
      return value
    }

    const resolvedType = schemaEntry.displayType || DisplayTypes.string
    const resolvedValue = schemaEntry.resolve ? schemaEntry.resolve(value) : value

    // DEFAULT - RETURN RESOLVED VALUE
    if (resolvedType === DisplayTypes.string ||
      resolvedType === 'number' ||
      resolvedType === 'icon' ||
      resolvedType === 'user') {
      return {
        type: resolvedType,
        value: resolvedValue
      }
    }

    // OBJECT - TODO
    if (resolvedType === 'object') {
      throw new Error('Resolvers.resolveFieldValue: resolvedType object not yet implemented')
    }

    // ARRAY - RECURSIVE RESOLVING CHILDREN
    if (resolvedType === 'array') {
      if (!Array.isArray(resolvedValue)) {
        console.error(new Error(`resolveFieldValue: expected resolvedValue to be an array on ${key}`))
        return { type: 'string', value }
      }
      const shallow = resolvedValue.slice(0)
      const resolvedNewArray = []
      for (let i = 0; i < shallow.length; i++) {
        const entry = shallow[i]
        const resolvedEntry = this.resolveFieldValue(`${key}.$`, entry)
        resolvedNewArray.push(resolvedEntry)
      }
      return { type: resolvedType, value: resolvedNewArray }
    }
    throw new Error('should never be reached ', key, value, resolvedType, resolvedValue)
  }
}
