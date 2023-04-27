import { Meteor } from 'meteor/meteor'
import { getQueryParam } from './params/getQueryParam'

const base = Meteor.absoluteUrl().slice(0, -1)

export const resolveRedirect = (redirectQueryParamName = 'redirect') => {
  const redirect = getQueryParam(redirectQueryParamName)
  const urlStr = redirect && decodeURIComponent(redirect)
  if (urlStr) {
    return urlStr.replace(base, '')
  }
}
