import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { CodeInvitation } from '../../../../classroom/invitations/CodeInvitations'
import { UserFactory } from '../../../../../api/accounts/registration/UserFactory'
import { rollbackAccount } from '../../../../../api/accounts/registration/rollbackAccount'
import { correctName } from '../../../../../api/utils/correctName'
import { userExists } from '../../../../../api/accounts/user/userExists'
import { createDocGetter } from '../../../../../api/utils/document/createDocGetter'
import { addStudent } from '../../../../classroom/schoolclass/methods/addStudent'
import { validateInvitation } from '../../../../classroom/invitations/validation/validateInvitation'
import { addUserToInvitation } from '../../../../classroom/invitations/methods/addUserToInvitation'

const errors = {
  codeInvalid: 'codeRegister.codeInvalid',
  emailExists: 'codeRegister.emailExists',
  failed: 'codeRegister.failed',
  invitationNotUpdated: 'codeRegister.invitationNotUpdated',
  studentNotAdded: 'codeRegister.studentNotAdded'
}

const getCodeDoc = createDocGetter({ name: CodeInvitation.name, optional: true })

/**
 * Registers a new user with a given invitation code.
 * The code can only be obtained, from a teacher.
 * @param code
 * @param email
 * @param firstName
 * @param lastName
 * @param password
 * @param institution
 * @param locale
 * @return {*}
 */
export const registerWithCode = async ({ code, email, firstName, lastName, password, institution, locale }) => {
  const codeDoc = await getCodeDoc({ code })

  // first we validate if the related code doc exists and is still valid
  if (!codeDoc || !validateInvitation(codeDoc)) {
    throw new Meteor.Error(errors.failed, errors.codeInvalid, { code })
  }

  // second we check if the user already exists by given Email address
  if (await userExists({ email })) {
    throw new Meteor.Error(errors.failed, errors.emailExists)
  }

  // third we create a new user
  let userId
  const options = { trim: true, upperCase: true }
  try {
    userId = await UserFactory.create({
      email: email || codeDoc.email,
      password: password,
      firstName: correctName(firstName ?? codeDoc.firstName, options),
      lastName: correctName(lastName ?? codeDoc.lastName, options),
      institution: correctName(codeDoc.institution ?? institution, options),
      role: codeDoc.role,
      locale: locale
    })
  }

  // we rethrow the error in a client-understandable format
  catch (accountCreationError) {
    throw new Meteor.Error(errors.failed, accountCreationError.reason)
  }

  const { classId } = codeDoc

  if (classId) {
    // if we have a class associated we aim to add the new student to the class
    // FIXME execution should not be in behalf of user, find another (capability based) check mechanism
    const teacherId = codeDoc.createdBy
    let studentAdded
    try {
      studentAdded = await addStudent({
        classId,
        userId,
        teacherId
      })
    } catch (e) {
      studentAdded = false
    }

    if (!studentAdded) {
      await rollbackAccount(userId)
      throw new Meteor.Error(errors.failed, errors.studentNotAdded, {
        classId,
        studentAdded
      })
    }
  }

  // At this point there are no rollbacks required, since
  // user account has successfully been created.
  // All errors that follow-up here won't result in an incomplete user account.

  // send verification email
  if (password && password.length > 0) {
    await Accounts.sendVerificationEmail(userId)
  }
  else {
    await Accounts.sendEnrollmentEmail(userId)
  }

  // invalidate invitation
  const invitationUpdated = await addUserToInvitation(codeDoc, userId)
  if (!invitationUpdated) {
    throw new Meteor.Error(errors.failed, errors.invitationNotUpdated)
  }

  // finally return userId
  return userId
}
