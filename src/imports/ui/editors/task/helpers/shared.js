import { ReactiveDict } from 'meteor/reactive-dict'

export const Shared = {
  cache: new ReactiveDict(),
  updatePage: null
}
