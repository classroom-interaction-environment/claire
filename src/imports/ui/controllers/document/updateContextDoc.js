import { callMethod } from './callMethod'

export const updateContextDoc = ({ context, _id, doc, timeout, prepare, receive, success, failure }) => callMethod({
  name: context.methods.update.name,
  args: { _id, doc },
  timeout,
  prepare,
  receive,
  success,
  failure
})
