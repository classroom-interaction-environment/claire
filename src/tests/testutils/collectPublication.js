import { assert } from 'chai'

export const collectPublication = async cursor => {
  if (!cursor?.fetch && !cursor.fetchAsync) {
    assert.fail('expected cursor')
  }
  return cursor.fetchAsync()
}
