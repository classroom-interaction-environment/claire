import { callMethod } from './callMethod'

export const insertContextDoc = ({ context, doc, prepare, receive, success, failure }) => callMethod({
  name: context.methods.insert.name,
  args: doc,
  prepare,
  receive,
  success,
  failure
})
