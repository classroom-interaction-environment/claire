/* global describe it */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import {
  firstNameSchema,
  emailSchema,
  passwordSchemaClassic,
  codeSchema,
  confirmSchema,
  userNameSchema,
  lastNameSchema,
  agreementSchema,
  password2Schema
} from '../registerUserSchema'
import { Schema } from '../../../schema/Schema'
import { expect } from 'chai'
import { PasswordConfig } from '../PasswordConfig'

const create = (value, extension) => {
  const def = Object.assign({}, { value }, extension)
  return Schema.create(def)
}

describe('registerUserSchema', function () {
  describe(firstNameSchema.name, function () {
    const firstNameDef = firstNameSchema()
    const firstName = create(firstNameDef)
    it('accepts a simple name', function () {
      firstName.validate({ value: 'John' })
    })
    it('throws on non-name input', function () {
      const value = Random.id(firstNameDef.max - 1)
      expect(() => firstName.validate({ value })).to.throw('form.validation.regEx', value)
    })
  })
  describe(lastNameSchema.name, function () {
    const lastNameDef = lastNameSchema()
    const lastName = create(lastNameDef)
    it('accepts a simple name', function () {
      lastName.validate({ value: 'Doe' })
    })
    it('throws on non-name input', function () {
      const value = Random.id(lastNameDef.max - 1)
      expect(() => lastName.validate({ value })).to.throw('form.validation.regEx', value)
    })
  })
  describe(userNameSchema.name, function () {
    const username = create(userNameSchema())
    it('accepts a simple username', function () {
      username.validate({ value: 'admin' })
      username.validate({ value: 'admin123' })
    })
  })
  describe(emailSchema.name, function () {
    const email = create(emailSchema())
    it('accepts a standard email', function () {
      email.validate({ value: `${Random.id()}@${Random.id()}.tld` })
    })
    it('throws on non-email input', function () {
      ['', 'john@doe', '@doe.com', '.@doe.com', Random.id()].forEach(value => {
        expect(() => email.validate({ value })).to.throw('form.validation.EmailWithTLD', value)
      })
    })
  })
  describe(codeSchema.name, function () {
    const code = create(codeSchema())
    it('accepts a simple name', function () {
      code.validate({ value: Random.id() })
    })
  })
  describe(agreementSchema.name, function () {
    const agree = Schema.create(agreementSchema())
    it('accepts a standard password', function () {
      agree.validate({ termsOfService: true, privacyPolicy: true })
    })
    it('throws on input that fails minimal requirements', function () {
      [{
        termsOfService: false,
        privacyPolicy: false
      }, {
        termsOfService: false,
        privacyPolicy: true
      }, {
        termsOfService: true,
        privacyPolicy: false
      }].forEach(value => expect(() => agree.validate(agree.validate(value))).to.throw(/.*/, value, value))
    })
  })
  describe(passwordSchemaClassic.name, function () {
    const passwordDef = passwordSchemaClassic()
    const password = create(passwordDef)

    it('accepts a standard password', function () {
      password.validate({ value: Random.id() })
    })
    it('throws on input that fails minimal requirements', function () {
      ['', undefined, null, Random.id(passwordDef.min - 1), Random.id(passwordDef.max + 1), '”#£ﬁ^˜·¯&()=)(/&%'].forEach(value => {
        expect(() => password.validate({ value })).to.throw(/.*/, value, value)
      })
    })
  })
  describe(password2Schema.name, function () {
    const pw2Settings = Meteor.settings.public.password
    const passwordSettings = PasswordConfig.from(pw2Settings)
    const pw2 = password2Schema({
      min: passwordSettings.min(),
      max: passwordSettings.max(),
      allowedChars: passwordSettings.allowedChars(),
      rules: passwordSettings.rules()
    })
    const password = create(pw2)

    it('accepts a password, that matches the given rules', function () {
      for (let i = 0; i < 100; i++) {
        const value = Random.secret() + '3' // guarantee a number
        try {
          password.validate({ value })
        }
        catch (e) {
          expect.fail(`${value} did not pass validation`)
        }
      }
    })

    it('rejects a password, that fails the criteria', function () {
      ['', undefined, null, 'hellohello', 'qwertyuiop', '1234568910', 'password12345', 'p@s5w0rd4321'].forEach(value => {
        expect(() => password.validate({ value })).to.throw(/.*/, value, value)
      })
    })
  })
  describe(confirmSchema.name, function () {
    const confirmSchemaDef = confirmSchema()
    const confirm = Schema.create({
      password: String,
      confirm: confirmSchemaDef
    })

    it('accepts if input matches password', function () {
      const password = Random.id()
      confirm.validate({ password, confirm: password })
    })
    it('throws if input does not match password', function () {
      const password = Random.id()
      ;[password.toUpperCase(), password.toLowerCase(), '', password + ' ', Random.id()].forEach(value => {
        expect(() => confirm.validate({ password, confirm: value })).to.throw(/.*/, value, value)
      })
    })
  })
})
