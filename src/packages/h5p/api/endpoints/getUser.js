import { Meteor } from 'meteor/meteor'

export const getUser = (req, res, next) => {
  if (req.userId && req.user) { return next() }
  let mtok = null
  if (req.headers['x-mtok']) {
    mtok = req.headers['x-mtok']
  }
  else {
    const cookie = req.Cookies
    if (cookie.has('x_mtok')) {
      mtok = cookie.get('x_mtok')
    }
  }

  if (mtok) {
    const userId = getUserIdFromToken(mtok)

    if (userId) {
      req.userId = () => userId
      req.user = (() => {
        let user
        return () => {
          if (!user) {
            user = Meteor.users.findOne(userId)
          }
          return user
        }
      })()
    }
  }

  next()
}
const isObject = obj => typeof obj === 'object'
const getUserIdFromToken = (xmtok) => {
  if (!xmtok) return null

  const sessions = Meteor.server.sessions
  const sessionIsMap = sessions instanceof Map
  const sessionIsObject = isObject(sessions)

  // throw an error upon an unexpected type of Meteor.server.sessions in order to identify breaking changes
  if (!sessionIsMap || !sessionIsObject) {
    throw new Error('Received incompatible type of Meteor.server.sessions')
  }

  if (sessionIsMap && sessions.has(xmtok) && isObject(sessions.get(xmtok))) {
    // to be used with >= Meteor 1.8.1 where Meteor.server.sessions is a Map
    return sessions.get(xmtok).userId
  }
  else if (sessionIsObject && xmtok in sessions && isObject(sessions[xmtok])) {
    // to be used with < Meteor 1.8.1 where Meteor.server.sessions is an Object
    return sessions[xmtok].userId
  }

  return null
}
