import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../../api/utils/getCollection'
import { _ } from 'meteor/underscore'

/** @deprecated **/
export const FormFactory = {

  getSelectOptions: function (collectionName, filter, fields, groupKey, resolver) {
    if (!fields || !fields.label || !fields.value) {
      throw new Meteor.Error('500', 'A fields object with label and value attributes are required to generate select options')
    }

    if (!filter) filter = {}

    const label = fields.label
    const value = fields.value
    const transform = { fields: {} }
    transform.fields[label] = 1
    transform.fields[value] = 1
    if (groupKey) {
      transform.fields[groupKey] = 1
    }

    return function () {
      const collection = getCollection(collectionName)
      if (!collection) {
        throw new Meteor.Error('500', 'A collection is required to generate select options')
      }

      // filter doc fields only by label/value references fields
      const data = collection.find(filter, transform).fetch()
      // console.log("ger data from " + collectionName, data, filter, transform);
      if (!data || data.length === 0) return []

      return groupKey
        ? FormFactory.optionsFromDataWihtGroups(data, label, value, groupKey, collection, resolver)
        : FormFactory.optionsFromDataWihtoutGroups(data, label, value)
    }
  },

  optionsFromDataWihtoutGroups (data, label, value) {
    const ret = []
    for (const element of data) {
      ret.push(this.createOption(element, label, value))
    }
    return ret
  },

  /*

   [{
   optgroup: "Fun Years",
   options: [
   {label: "2014", value: 2014},
   {label: "2013", value: 2013},
   {label: "2012", value: 2012}
   ]
   },
   {
   optgroup: "Boring Years",
   options: [
   {label: "2011", value: 2011},
   {label: "2010", value: 2010},
   {label: "2009", value: 2009}
   ]
   }]
   */
  optionsFromDataWihtGroups (data, label, value, groupKey, collection, resolver) {
    const ret = []
    const groupNames = this.getUniqueGroupNames(data, groupKey)
    // console.log("******************************")
    // console.log("optionsFromDataWihtGroups");
    // console.log(groupNames);

    for (let groupName of groupNames) {
      if (typeof groupName === 'undefined') groupName = { $exists: false }
      const query = {}
      query[groupKey] = groupName
      const filteredData = collection.find(query, { sort: { title: 1 } }).fetch()
      // console.log(query, filteredData);
      ret.push(this.createOptionsGroup(groupName, filteredData, label, value, resolver))
    }
    // console.log(ret);
    // console.log("-------------------------");
    return ret
  },

  getUniqueGroupNames (data, groupKey) {
    return _.uniq(data.map(function (element) {
      return element[groupKey]
    })).sort()
  },

  createOptionsGroup (name, elements, label, value, resolver) {
    const optGroup = {}
    optGroup.optgroup = resolver ? resolver(name) : String(name)
    optGroup.options = []
    for (const element of elements) {
      optGroup.options.push(this.createOption(element, label, value))
    }
    return optGroup
  },

  createOption (element, label, value) {
    return {
      label: element[label],
      value: element[value]
    }
  },

  _i18n: null,

  _selectFirstOption: null,

  getSelectFirstOption: function () {
    if (!this._i18n || !this._selectFirstOption) { throw new Meteor.Error('500', 'Cannot create select option on missing translation system (i18n, _selectFirstOption') }

    return this._i18n.__(this._selectFirstOption)
  }

}
