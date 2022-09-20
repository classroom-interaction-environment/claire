/* global describe it */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { PasswordConfig } from '../PasswordConfig'

describe('PasswordConfig', function () {
  describe('constructor', function () {
    it('can be created without options, using defaults', function () {
      const config = PasswordConfig.from()
      expect(config.id).to.be.a('string')
      const defaults = PasswordConfig.defaults()
      const all = config.all()
      delete all.rules
      expect(all).to.deep.equal(defaults)
    })

    it('can be created with options', function () {
      const settings = {
        min: {
          value: 111,
          rule: false
        },
        max: {
          value: 123,
          rule: false
        },
        allowedChars: {
          value: '[0-9]',
          rule: true,
          message: 'only numbers'
        },
        icon: 'foobar',
        confirm: false,
        rules: [{
          test: () => {},
          message: () => {}
        }],
        blacklist: []
      }
      const config = PasswordConfig.from(settings)
      expect(config.all()).to.not.deep.equal(PasswordConfig.defaults())
    })
  })

  describe('values', function () {
    it('icon', function () {
      const config = PasswordConfig.from({ icon: 'lock' })
      expect(config.icon()).to.equal('lock')
      expect(config.icon()).to.not.equal(PasswordConfig.defaults().icon)
    })
    it('min', function () {
      const config = PasswordConfig.from({ min: 16 })
      expect(config.min()).to.equal(16)
      expect(config.min()).to.not.equal(PasswordConfig.defaults().min.value)
    })
    it('max', function () {
      const config = PasswordConfig.from({ max: 161 })
      expect(config.max()).to.equal(161)
      expect(config.max()).to.not.equal(PasswordConfig.defaults().max.value)
    })
    it('allowedChars', function () {
      const config = PasswordConfig.from({ allowedChars: '[a-z]' })
      const allowedChars = new RegExp(config.allowedChars(), 'gi')
      expect(allowedChars.test('abcdefghijklmnopqrstuvwxyz')).to.equal(true)
      expect(allowedChars.test('Z')).to.equal(false)
      expect(allowedChars.test('9')).to.equal(false)
      expect(allowedChars.test('@')).to.equal(false)
    })
    it('confirm', function () {
      const config = PasswordConfig.from({ confirm: false })
      expect(config.confirm()).to.equal(false)
      expect(config.confirm()).to.not.equal(PasswordConfig.defaults().confirm)
    })
    it('blacklist', function () {
      const config = PasswordConfig.from()
      const list = [
        'passwOrd',
        '12345678'
      ]
      const message = () => 'failed'
      const ruleLen = config.rules().length
      const rules = config.blacklist({ list, message })
      expect(rules).to.have.lengthOf(ruleLen + 1)
    })
  })

  describe('rules', function () {
    it('comes with a rules checker', function () {
      const config = PasswordConfig.from()
      expect(config.rules()).to.have.lengthOf(3)
      expect(config.check(Random.id())).to.equal(undefined)
      expect(config.check(Random.id())).to.equal(undefined)
      expect(config.check('')).to.have.lengthOf(2)
      expect(config.check(null)).to.have.lengthOf(2)
      expect(config.check(1)).to.have.lengthOf(2)
    })
  })
})
