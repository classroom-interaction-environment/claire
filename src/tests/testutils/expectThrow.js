import { expect } from 'chai'

export const expectThrow = async ({ fn, error, message, reason, details }) => {
  try {
    await fn()
    expect.fail('Expected function to throw an error, but it did not.')
  } catch (e) {
    if (message) {
      expect(e.message).to.equal(message)
    }
    if (error) {
      expect(e.error).to.equal(error)
    }
    if (reason) {
      expect(e.reason).to.equal(reason)
    }
    if (details) {
      expect(e.details).to.deep.equal(details)
    }
  }
}
