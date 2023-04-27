import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Email } from 'meteor/email'
import { i18n } from '../../../api/language/language'
import { createLog } from '../../../api/log/createLog'

const log = createLog({ name: 'Email' })
const { from, siteName } = Meteor.settings.emailTemplates
const { passwordReset } = Meteor.settings.accounts.inform
const informPasswordReset = ({ allowed, type, methodName }) =>
  allowed &&
  passwordReset &&
  type === 'password' &&
  methodName === 'resetPassword'

Accounts.onLogin(function ({ type, allowed, methodName, user }) {
  if (informPasswordReset({ type, allowed, methodName })) {
    const to = passwordReset
    const subject = createInfomailSubject({ type: 'passwordReset' })
    const text = createInfomailText({ user, type: 'passwordReset' })
    Email.send({ to, from, subject, text })
  }
})

function createInfomailSubject ({ type }) {
  const text = i18n.get(`accounts.inform.${type}.subject`, {
    siteName: siteName
  })

  if (Meteor.isDevelopment) {
    log('subject', text)
  }

  return text
}

function createInfomailText ({ user, type }) {
  const { firstName, lastName, institution } = user.firstName
  const fullName = `${firstName} ${lastName}`

  const text = i18n.get(`accounts.inform.${type}.text`, {
    institution,
    name: fullName,
    siteName: siteName
  })

  if (Meteor.isDevelopment) {
    log('body', text)
  }

  return text
}
