import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'

const accountsConfig = Meteor.settings.accounts.config

Accounts.config(accountsConfig)
Accounts.setDefaultPublishFields({
  createdAt: 0,
  services: 0,
  presence: 0
})
