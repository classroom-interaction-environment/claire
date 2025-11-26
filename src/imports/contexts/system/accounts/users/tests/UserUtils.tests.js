/* global describe it beforeEach afterEach */
import { Random } from 'meteor/random'
import { stubUser, unstubUser } from '../../../../../../tests/testutils/stubUser'
import { UserUtils } from '../UserUtils'
import { assert } from 'chai'
import {
  clearAllCollections, mockCollections,
  restoreAllCollections
} from '../../../../../../tests/testutils/mockCollection'
import { Admin } from '../../admin/Admin'
import { onClientExec, onServerExec } from '../../../../../api/utils/archUtils'
import { Users } from '../User'

const userObj = () => ({
  _id: Random.id(),
  username: Random.id(),
  email: `${Random.id()}@caroapp.de`,
  password: Random.id(),
  custom: 'foo'
})

describe('UserUtils', function () {

})
