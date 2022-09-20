import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { Email } from 'meteor/email'
import { i18n } from '../../../api/language/language'

const { from, siteName } = Meteor.settings.emailTemplates
const { passwordReset } = Meteor.settings.accounts.inform
const informPasswordReset = ({ allowed, type, methodName }) =>
  allowed && passwordReset && type === 'password' && methodName === 'resetPassword'

Accounts.onLogin(function ({ type, allowed, methodName, user }) {
  if (informPasswordReset({ type, allowed, methodName })) {
    const to = passwordReset
    const subject = infomailSubject({ type: 'passwordReset' })
    const text = infomailText({ user, type: 'passwordReset' })
    Email.send({ to, from, subject, text })
  }
})

function infomailSubject ({ type }) {
  const text = i18n.get(`accounts.inform.${type}.subject`, {
    siteName: siteName
  })
  if (Meteor.isDevelopment) console.info(text)
  return text
}

function infomailText ({ user, type }) {
  const firstName = user.firstName
  const lastName = user.lastName
  const fullName = `${firstName} ${lastName}`
  const text = i18n.get(`accounts.inform.${type}.text`, {
    name: fullName,
    siteName: siteName
  })
  if (Meteor.isDevelopment) console.info(text)
  return text
}
