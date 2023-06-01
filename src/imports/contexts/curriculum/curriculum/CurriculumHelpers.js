import { Meteor } from 'meteor/meteor'
import { RevisionTypes } from '../curriculum/types/RevisionType'
import { Lang } from '../utils/Translate'
import { getCollection } from '../../../api/utils/getCollection'

/** @deprecated**/
export const CurriculumHelpers = {

  /** @deprecated use utils/Lang.translate instead * */
  translate (value) {
    return Lang.translate(value)
  },

  /** @deprecated use utils/Lang.setTranslationProvider instead * */
  setTranslationProvider (provider) {
    return Lang.setTranslationProvider(provider)
  },

  // ///////////////////////////////////////////////////////////////////////////////

  navdata: null,

  getNavData () {
    if (!this.navdata) { this.navdata = this.generateNavData() }
    return this.navdata
  },

  generateNavData (allContexts) {
    if (!allContexts || allContexts.length === 0) {
      throw new Meteor.Error('requires at least one entry in array')
    }

    return allContexts
    /* return allContexts.map(function(element){
     return {
     name: element.name,
     label: element.label,
     };
     }).sort(function(a,b){
     return a.label.localeCompare(b.label);
     }); */
  },

  isDefined (value) {
    return value !== null && typeof value !== 'undefined'
  },

  getLabelByValue (typeClass, value) {
    if (!typeClass || !typeClass.entries) {
      console.error('can\'t resolve entries on undefined ')
      return value
    }
    const entries = Object.values(typeClass.entries)
    for (const entry of entries) {
      if (String(entry.value) === String(value)) { return entry.label() }
    }
    return value
  },

  getStatusIcon (value) {
    switch (value) {
      case RevisionTypes.entries.UNREVISED.value:
        return {
          icon: RevisionTypes.entries.UNREVISED.icon,
          title: RevisionTypes.entries.UNREVISED.label(),
          class: ['text-muted']
        }
      case RevisionTypes.entries.COMPLETE.value:
        return {
          icon: RevisionTypes.entries.COMPLETE.icon,
          title: RevisionTypes.entries.COMPLETE.label(),
          class: ['text-success']
        }
      case RevisionTypes.entries.IN_REVISION.value:
        return {
          icon: RevisionTypes.entries.IN_REVISION.icon,
          title: RevisionTypes.entries.IN_REVISION.label(),
          class: ['text-info']
        }
      case RevisionTypes.entries.FLAGGED.value:
        return {
          icon: RevisionTypes.entries.FLAGGED.icon,
          title: RevisionTypes.entries.FLAGGED.label(),
          class: ['text-danger']
        }
      default:
        throw new Error('Unexpected revision type')
    }
  },

  /**
   * Generates a link to the specific curriculum context document.
   * @param context
   * @param docId
   * @param title
   * @returns {string}
   */
  generateLink (context, docId, title, inNewTab = true) {
    const target = inNewTab ? `target="${docId}"` : ''
    return `<a  href="/collection/${context}/${docId}" title="${title}" ${target} >${title}</a>`
  },

  /**
   * Generates a references link(s) for either single string value or array of values.
   * If a link canot be generated, the original value (docId) is used aS A FALLBACK.
   * @param collection The collection to lookup for docIds
   * @param contextName The name of the collection, here specified as context.
   * @param value Either a string or an array of strings, which represent the docId(s)
   * @returns {string} a generated html string with 1..n links
   */
  generateRef (collectionName, contextName, value) {
    const collection = getCollection(collectionName)
    if (!collection) { throw new Meteor.Error(`Could not find collection <${collectionName}> on context <${contextName}>`) }

    if (typeof value === 'string') {
      return `${this.generateSingleRef(collection, contextName, value) || value}<br >`
    }
    else if (Array.isArray(value)) {
      let ret = ''
      for (const docId of value) {
        ret += `${this.generateSingleRef(collection, contextName, docId) || docId}<br >`
      }
      return ret
    }
    throw new Meteor.Error(`unexpected value type ${typeof value}`)
  },

  /**
   *
   * @param collection
   * @param contextName
   * @param docId
   * @returns {*}
   * @private
   */
  generateSingleRef (collection, contextName, docId) {
    const doc = collection.findOne({ _id: docId })
    if (doc) {
      return this.generateLink(contextName, docId, this.cutEntry(doc.title))
    }
    return null
  },

  cutEntry (entry, length = 80) {
    entry = entry ? String(entry) : ''
    return entry.length > length ? entry.substr(0, length) : entry
  },

  printAllContextNames () {
    const keys = Object.keys(this.context)
    for (const key of keys) {
      console.warn(`${key} => `)
    }
  }
}
