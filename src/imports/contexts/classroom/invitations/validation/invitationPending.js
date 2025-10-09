import { invitationExpired } from './invitationExpired'
import { invitationComplete } from './invitationComplete'

/**
 * Returns if a doc is considered to be active and pending to be completed
 * @param codeDoc {object} - The code document to be checked
 * @return {boolean} true if not expired and not complete
 */
export const invitationPending = codeDoc => {
  return codeDoc && !invitationExpired(codeDoc) && !invitationComplete(codeDoc)
}