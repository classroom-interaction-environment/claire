import { Random } from 'meteor/random'

export const exampleUser = ({
  _id = Random.id(),
  username = Random.id(),
  email = `${Random.id()}@test.tld`,
  firstName,
  lastName,
  institution = Random.id()
} = {}) => {
  return {
    _id,
    username,
    emails: [{
      address: email
    }],
    firstName,
    lastName,
    institution
  }
}
