/* global describe it beforeEach */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { onServerExec, onServer, onClient, onClientExec } from '../../api/utils/archUtils'
import { expect } from 'chai'

describe('archUtils', function () {
  let value
  let executed
  let exec
  beforeEach(function () {
    value = Random.id()
    executed = false
    exec = () => {
      executed = true
      return value
    }
  })

  describe(onClient.name, function () {
    if (Meteor.isClient) {
      it('returns the given value on client', function () {
        const actual = onClient(value)
        expect(actual).to.equal(value)
      })
    }
    if (Meteor.isServer) {
      it('does not return returns the given value on server', function () {
        const actual = onClient(value)
        expect(actual).to.equal(undefined)
      })
    }
  })
  describe(onServer.name, function () {
    if (Meteor.isServer) {
      it('returns the given value on server', function () {
        const actual = onServer(value)
        expect(actual).to.equal(value)
      })
    }
    if (Meteor.isClient) {
      it('does not return returns the given value on client', function () {
        const actual = onServer(value)
        expect(actual).to.equal(undefined)
      })
    }
  })
  describe(onClientExec.name, function () {
    if (Meteor.isClient) {
      it('executed a function on the client', function () {
        const actual = onClientExec(exec)
        expect(actual).to.equal(value)
        expect(executed).to.equal(true)
      })
    }
    if (Meteor.isServer) {
      it('does not execute a function on the server', function () {
        const actual = onClientExec(exec)
        expect(actual).to.equal(undefined)
        expect(executed).to.equal(false)
      })
    }
  })
  describe(onServerExec.name, function () {
    if (Meteor.isServer) {
      it('executed a function on the server', function () {
        const actual = onServerExec(exec)
        expect(actual).to.equal(value)
        expect(executed).to.equal(true)
      })
    }
    if (Meteor.isClient) {
      it('does not execute a function on the client', function () {
        const actual = onServerExec(exec)
        expect(actual).to.equal(undefined)
        expect(executed).to.equal(false)
      })
    }
  })
})
