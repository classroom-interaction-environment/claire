import { callMethod } from './callMethod'

export const insertContextDoc = ({ context, doc, timeout, prepare, receive, success, failure }) => callMethod({
  name: context.methods.insert.name,
  args: doc,
  prepare,
  receive,
  success,
  failure
})
