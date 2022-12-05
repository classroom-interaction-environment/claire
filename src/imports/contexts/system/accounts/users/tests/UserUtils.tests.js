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
  let user
  let AdminCollection

  before(function () {
    [AdminCollection] = mockCollections(Admin, Users)
  })

  beforeEach(function () {
    user = userObj()
  })

  afterEach(function () {
    unstubUser(true, true)
    clearAllCollections()
  })

  after(function () {
    restoreAllCollections()
  })

  describe('isAdmin', function () {
    it('is returning false on a non-logged-in user', function () {
      stubUser(null, null)
      assert.isFalse(UserUtils.isAdmin())
    })

    it('returns false for a logged in non-admin', function () {
      stubUser(user, user._id)
      assert.isFalse(UserUtils.isAdmin())
    })

    onServerExec(function () {
      it('returns false for a fake admin', function () {
        stubUser(user, user._id, [UserUtils.roles.admin], user.institution)
        assert.isFalse(UserUtils.isAdmin())
      })

      it('returns true for a true admin', function () {
        stubUser(user, user._id, [UserUtils.roles.admin], user.institution)
        AdminCollection.insert({ userId: user._id })
        assert.isTrue(UserUtils.isAdmin())
      })
    })

    onClientExec(function () {
      it('returns true for a roles-admin', function () {
        stubUser(user, user._id, [UserUtils.roles.admin], user.institution)
        assert.isTrue(UserUtils.isAdmin())
      })
    })
  })

  describe('hasRole', function () {
    it('returns false on logged in but not in role', function () {
      const expectedRole = Random.id()
      stubUser(user, user._id)
      assert.isFalse(UserUtils.hasRole(user._id, expectedRole))
    })

    it('returns true on logged in and in role', function () {
      const expectedRole = Random.id()
      stubUser(user, user._id, expectedRole, 'curriculum')
      assert.isTrue(UserUtils.hasRole(user._id, expectedRole, 'curriculum'))
    })
  })

  describe('hasAtLeastRole', function () {
    it('throws if is not in highest role', function () {
      const userId = user._id
      stubUser(user, userId)
      assert.throws(function () {
        UserUtils.hasAtLeastRole(userId, 'teacher')
      })
    })

    it('throws if no valid role is given', function () {
      const userId = user._id
      stubUser(user, userId)
      assert.throws(function () {
        UserUtils.getHighestRole(userId)
      })
    })

    it('returns determines the correct roles', function () {
      it('hasAtLeastRole', function () {
        const userId = user._id
        stubUser(user, userId, [UserUtils.roles.teacher])

        assert.isFalse(UserUtils.hasAtLeastRole(userId, UserUtils.roles.admin))
        assert.isFalse(UserUtils.hasAtLeastRole(userId, UserUtils.roles.schoolAdmin))
        assert.isTrue(UserUtils.hasAtLeastRole(userId, UserUtils.roles.teacher))
        assert.isTrue(UserUtils.hasAtLeastRole(userId, UserUtils.roles.student))
        assert.isTrue(UserUtils.hasAtLeastRole(userId, UserUtils.roles.visitor))
      })
    })
  })
})
