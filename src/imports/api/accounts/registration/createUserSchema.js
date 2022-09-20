import { Meteor } from 'meteor/meteor'
import { PasswordConfig } from './PasswordConfig'
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  roleSchema,
  institutionSchema,
  password2Schema
} from './registerUserSchema'

const passwordConfig = PasswordConfig.from(Meteor.settings.public.password)

export const createUserSchema = {
  email: emailSchema(),
  firstName: firstNameSchema(),
  lastName: lastNameSchema(),
  role: roleSchema(),
  institution: institutionSchema(),
  password: password2Schema({
    optional: true,
    min: passwordConfig.min(),
    max: passwordConfig.max(),
    rules: passwordConfig.rules()
  })
}
