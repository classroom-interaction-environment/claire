import { assert } from 'chai'

export const collectPublication = cursor => {
  if (!cursor?.fetch) {
    assert.fail('expected cursor')
  }
  return cursor.fetch()
}
