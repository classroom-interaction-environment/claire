import { Match } from 'meteor/check'

export const isNonEmptyString = s => typeof s === 'string' && s.length > 0
export const matchNonEmptyString = Match.Where(isNonEmptyString)
