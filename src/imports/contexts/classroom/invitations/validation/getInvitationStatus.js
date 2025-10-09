import { CodeInvitation } from '../CodeInvitations'
import { invitationComplete } from './invitationComplete'
import { invitationExpired } from './invitationExpired'

/**
 * Returns the considered status of a code document
 * @param createdAt
 * @param expires
 * @param registeredUsers
 * @param maxUsers
 * @param _id
 * @return {*}
 */
export const getInvitationStatus = ({
                                      invalid,
                                      createdAt,
                                      expires,
                                      registeredUsers,
                                      maxUsers,
                                      _id
                                    }) => {
  const isExpired = invitationExpired({
    invalid,
    createdAt,
    expires
  })
  const isComplete = invitationComplete({
    _id,
    registeredUsers,
    maxUsers
  })

  if (!isExpired && !isComplete) return CodeInvitation.status.pending
  if (isComplete) return CodeInvitation.status.complete
  if (isExpired) return CodeInvitation.status.expired
  throw new Error(`Unexpected undefined state for invitation document [${_id}]`)
}