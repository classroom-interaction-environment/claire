import { Accounts } from 'meteor/accounts-base'
import { DDP } from 'meteor/ddp-client'
import { Meteor } from 'meteor/meteor'
import { Cookies } from 'meteor/ostrio:cookies'

const cookie = new Cookies()

const setTokenCookie = () => {
  if (Meteor.connection._lastSessionId) {
    cookie.set('x_mtok', Meteor.connection._lastSessionId, { path: '/', sameSite: 'Lax' })
  }
}

DDP.onReconnect((conn) => {
  conn.onReconnect = setTokenCookie
})

Tracker.autorun(() => {
  const user = Meteor.user()
  if (!user) { return }
  setTokenCookie()
})
