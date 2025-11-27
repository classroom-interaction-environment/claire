import { assert } from 'chai'

export const collectPublication = async cursor => {
  if (!cursor?.fetch) {
    assert.fail('expected cursor')
  }
  return cursor.fetchAsync()
}
