export const onServerExec = fn => {
  if (Meteor.isServer) {
    return fn()
  }
}
