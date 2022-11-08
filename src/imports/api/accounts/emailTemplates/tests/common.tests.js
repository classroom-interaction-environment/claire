/* eslint-env mocha */
import { expect } from 'chai'
import { getFullName, getCredentialsAsBuffer } from '../common'

describe('common', function () {
  describe(getFullName.name, function () {
    it('returns the full name', function () {
      const user = {
        firstName: 'John',
        lastName: 'Doe'
      }
      expect(getFullName(user)).to.equal('John Doe')
    })
  })

  describe(getCredentialsAsBuffer.name, function () {
    it('returns a buffer from the user object', function () {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        emails: [
          { address: 'jd@example.com' }
        ]
      }

      const str = getCredentialsAsBuffer(user)
      const buffer = Buffer.from(str, 'base64')
      const decoded = buffer.toString('utf-8')
      expect(decoded).to.equal(JSON.stringify([user.emails[0].address, user.firstName, user.lastName]))
    })
  })
})
