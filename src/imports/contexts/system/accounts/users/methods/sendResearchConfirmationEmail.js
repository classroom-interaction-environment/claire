import { Email } from 'meteor/email'
import { i18n } from '../../../../../api/language/language'

const { from, siteName, textEncoding } = Meteor.settings.emailTemplates
const headers = {
  'Content-Transfer-Encoding': textEncoding,
  'Content-Type': 'text/html; charset="UTF-8"'
}

export const sendResearchConfirmationEmail = ({ to, fullName, url }) => {
  const subject = `${siteName} ${i18n.get('user.research.optIn')}`
  const text = i18n.get('user.research.optInMail', { fullName, url })
  if (Meteor.isDevelopment) {
    console.info(url)
  }
  return Email.send({
    from, to, subject, text, headers
  })
}
