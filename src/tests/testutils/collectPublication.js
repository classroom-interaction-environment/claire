import { assert } from 'chai'

export const collectPublication = cursor => {
  if (!cursor || !cursor instanceof Mongo.Cursor) {
    assert.fail('expected cursor')
  }
  return cursor.fetch()
}
