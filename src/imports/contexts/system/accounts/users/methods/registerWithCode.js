import { Meteor } from 'meteor/meteor'
import { Users } from '../User'
import { CodeInvitation } from '../../../../classroom/invitations/CodeInvitations'
import { UserFactory } from '../../../../../api/accounts/registration/UserFactory'
import { SchoolClass } from '../../../../classroom/schoolclass/SchoolClass'
import { rollbackAccount } from '../../../../../api/accounts/registration/rollbackAccount'
import { correctName } from '../../../../../api/utils/correctName'
import { userExists } from '../../../../../api/accounts/user/userExists'

export const registerWithCode = function ({ code, email, firstName, lastName, password, institution }) {
  const codeDoc = CodeInvitation.helpers.getCodeDoc(code)

  // first we validate if the related code doc exists and is still valid
  if (!CodeInvitation.helpers.validate(codeDoc)) {
    throw new Meteor.Error(Users.errors.codeRegister.failed, Users.errors.codeRegister.codeInvalid)
  }

  // second we check if the user already exists by given Email address
  if (userExists({ email })) {
    throw new Meteor.Error(Users.errors.codeRegister.failed, Users.errors.codeRegister.emailExists)
  }

  // third we create a new user
  let userId
  const options = { trim: true, upperCase: true }
  try {
    userId = UserFactory.create({
      email: email || codeDoc.email,
      password: password,
      firstName: correctName(firstName || codeDoc.firstName, options),
      lastName: correctName(lastName || codeDoc.lastName, options),
      institution: correctName(codeDoc.institution || institution, options),
      role: codeDoc.role
    })
  }

  // we rethrow the error in a client-understandable format
  catch (accountCreationError) {
    throw new Meteor.Error(Users.errors.codeRegister.failed, 'account', accountCreationError.reason)
  }

  const { classId } = codeDoc

  if (classId) {
    // if we have a class associated we aim to add the new student to the class
    // FIXME execution should not be in behalf of user, find another (capability based) check mechanism
    const thisContext = { userId: codeDoc.createdBy }
    const studentAdded = SchoolClass.helpers.addStudent.call(thisContext, {
      classId,
      userId
    })

    if (!studentAdded) {
      rollbackAccount(userId)
      throw new Meteor.Error(Users.errors.codeRegister.failed, 'class', JSON.stringify({
        classId,
        studentAdded
      }))
    }
  }

  // At this point there are no rollbacks required, since
  // user account has successfully been created.
  // All errors that follow-up here won't result in an incomplete user account.

  // send verification email
  if (password && password.length > 0) {
    Accounts.sendVerificationEmail(userId)
  } else {
    Accounts.sendEnrollmentEmail(userId)
  }

  // invalidate invitation
  const invitationUpdated = CodeInvitation.helpers.addUserToInvitation(codeDoc, userId)
  if (!invitationUpdated) {
    throw new Meteor.Error(Users.errors.codeRegister.failed, 'codeRegister.invitationNotUpdated')
  }

  // finally return userId
  return userId
}