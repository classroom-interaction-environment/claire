import { ReactiveDict } from 'meteor/reactive-dict'
import { Template } from 'meteor/templating'

export const _loaded = new ReactiveDict()

Template.registerHelper('allLoaded', function () {
  console.warn('allLoaded helper is deprecated use initComplete')
  return _loaded.get('admin') && _loaded.get('settings') && _loaded.get('theme') && _loaded.get('roles')
})
