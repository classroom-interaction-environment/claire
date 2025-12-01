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

describe('registerUserSchema', () => {
  describe(firstNameSchema.name, () => {
    const firstNameDef = firstNameSchema()
    const firstName = create(firstNameDef)
    it('accepts a simple name', () => {
      firstName.validate({ value: 'John' })
    })
    it('throws on non-name input', () => {
      const value = Random.id(firstNameDef.max - 1)
      expect(() => firstName.validate({ value })).to.throw('form.validation.regEx', value)
    })
  })
  describe(lastNameSchema.name, () => {
    const lastNameDef = lastNameSchema()
    const lastName = create(lastNameDef)
    it('accepts a simple name', () => {
      lastName.validate({ value: 'Doe' })
    })
    it('throws on non-name input', () => {
      const value = Random.id(lastNameDef.max - 1)
      expect(() => lastName.validate({ value })).to.throw('form.validation.regEx', value)
    })
  })
  describe(userNameSchema.name, () => {
    const username = create(userNameSchema())
    it('accepts a simple username', () => {
      username.validate({ value: 'admin' })
      username.validate({ value: 'admin123' })
    })
  })
  describe(emailSchema.name, () => {
    const email = create(emailSchema())
    it('accepts a standard email', () => {
      email.validate({ value: `${Random.id()}@${Random.id()}.tld` })
    })
    it('throws on non-email input', () => {
      ['', 'john@doe', '@doe.com', '.@doe.com', Random.id()].forEach(value => {
        expect(() => email.validate({ value })).to.throw('form.validation.EmailWithTLD', value)
      })
    })
  })
  describe(codeSchema.name, () => {
    const code = create(codeSchema())
    it('accepts a simple name', () => {
      code.validate({ value: Random.id() })
    })
  })
  describe(agreementSchema.name, () => {
    const agree = Schema.create(agreementSchema())
    it('accepts a standard password', () => {
      agree.validate({ termsOfService: true, privacyPolicy: true })
    })
    it('throws on input that fails minimal requirements', () => {
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
  describe(passwordSchemaClassic.name, () => {
    const passwordDef = passwordSchemaClassic()
    const password = create(passwordDef)

    it('accepts a standard password', () => {
      password.validate({ value: Random.id() })
    })
    it('throws on input that fails minimal requirements', () => {
      ['', undefined, null, Random.id(passwordDef.min - 1), Random.id(passwordDef.max + 1), '”#£ﬁ^˜·¯&()=)(/&%'].forEach(value => {
        expect(() => password.validate({ value })).to.throw(/.*/, value, value)
      })
    })
  })
  describe(password2Schema.name, () => {
    const pw2Settings = Meteor.settings.public.password
    const passwordSettings = PasswordConfig.from(pw2Settings)
    const pw2 = password2Schema({
      min: passwordSettings.min(),
      max: passwordSettings.max(),
      allowedChars: passwordSettings.allowedChars(),
      rules: passwordSettings.rules()
    })
    const password = create(pw2)

    it('accepts a password, that matches the given rules', () => {
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

    it('rejects a password, that fails the criteria', () => {
      ['', undefined, null, 'hellohello', 'qwertyuiop', '1234568910', 'password12345', 'p@s5w0rd4321'].forEach(value => {
        expect(() => password.validate({ value })).to.throw(/.*/, value, value)
      })
    })
  })
  describe(confirmSchema.name, () => {
    const confirmSchemaDef = confirmSchema()
    const confirm = Schema.create({
      password: String,
      confirm: confirmSchemaDef
    })

    it('accepts if input matches password', () => {
      const password = Random.id()
      confirm.validate({ password, confirm: password })
    })
    it('throws if input does not match password', () => {
      const password = Random.id()
      ;[password.toUpperCase(), password.toLowerCase(), '', password + ' ', Random.id()].forEach(value => {
        expect(() => confirm.validate({ password, confirm: value })).to.throw(/.*/, value, value)
      })
    })
  })
})
