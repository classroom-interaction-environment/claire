export const onClientExec = fn => {
  if (Meteor.isClient) {
    return fn()
  }
}
