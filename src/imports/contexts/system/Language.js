import { Meteor } from "meteor/meteor"
import { onServer } from '../../api/utils/archUtils'

/**
 * Represents Language settings for users but as own context to allow
 * extensibility in case this will broaden in terms of scope.
 */
export const Language = {
  name: 'language',
  label: 'language,title',
  icon: 'chat',
  methods: {
    updateProfile: {
      name: 'language.methods.updateProfile',
      schema: {
        lang: {
          type: String,
          max: 2
        }
      },
      timeInterval: 1000,
      numRequests: 10,
      run: onServer(function run (doc) {
        const userDoc = Meteor.users.findOne(this.userId)
        const locale = userDoc.locale || {}
        locale.lang = doc.lang
        const updated = Meteor.users.update(this.userId, { $set: { locale } })
        return updated && lang
      })
    }
  }
}
