/* global describe it beforeEach afterEach */
import { Random } from 'meteor/random'

const _userObj = () => ({
  _id: Random.id(),
  username: Random.id(),
  email: `${Random.id()}@caroapp.de`,
  password: Random.id(),
  custom: 'foo'
})

describe('UserUtils', () => {

})
