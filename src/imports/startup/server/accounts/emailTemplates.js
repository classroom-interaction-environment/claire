import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import {
  getVerifyEmailSubject,
  getVeryFyEmailText
} from '../../../api/accounts/emailTemplates/verifyEmail'
import {
  getResetPasswordSubject,
  getResetPasswordText
} from '../../../api/accounts/emailTemplates/resetPassword'
import {
  getEnrollAccountSubject,
  getEnrollAccountText
} from '../../../api/accounts/emailTemplates/enrollAccount'

const { from, textEncoding, supportEmail } = Meteor.settings.emailTemplates
const { siteName, defaultLocale } = Meteor.settings.public
const { passwordResetTokenExpirationInDays, passwordEnrollTokenExpirationInDays } = Meteor.settings.accounts.config

Accounts.emailTemplates.siteName = siteName
Accounts.emailTemplates.from = from
Accounts.emailTemplates.textEncoding = textEncoding

// /////////////////////////////////////////////////////////////////////////////
// ENROLL ACCOUNTS
// /////////////////////////////////////////////////////////////////////////////
Accounts.emailTemplates.enrollAccount.subject = getEnrollAccountSubject({
  siteName,
  defaultLocale
})

Accounts.emailTemplates.enrollAccount.text = getEnrollAccountText({
  expiration: passwordEnrollTokenExpirationInDays,
  defaultLocale,
  supportEmail
})

// /////////////////////////////////////////////////////////////////////////////
// RESET PASSWORD
// /////////////////////////////////////////////////////////////////////////////
Accounts.emailTemplates.resetPassword.subject = getResetPasswordSubject({
  siteName,
  defaultLocale
})

Accounts.emailTemplates.resetPassword.text = getResetPasswordText({
  expiration: passwordResetTokenExpirationInDays,
  defaultLocale,
  supportEmail
})

// /////////////////////////////////////////////////////////////////////////////
// VERIFY EMAIL
// /////////////////////////////////////////////////////////////////////////////
Accounts.emailTemplates.verifyEmail.subject = getVerifyEmailSubject({
  siteName,
  defaultLocale
})

Accounts.emailTemplates.verifyEmail.text = getVeryFyEmailText({ defaultLocale, supportEmail })
