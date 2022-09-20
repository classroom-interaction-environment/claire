import { Meteor } from 'meteor/meteor'

const features = Object.create(null)
Object.assign(features, Meteor.settings.public.features)

/**
 * Provides a n interface to the feature config.
 */
export const Features = {}

Features.get = (name) => {
  if (!name || !Object.hasOwnProperty.call(features, name)) {
    console.debug(name, features, features[name])
    throw new Error(`Features has no feature by name ${name}`)
  }
  return features[name]
}

Features.ensure = (name, value = true) => {
  const current = Features.get(name)
  if (current !== value) {
    throw new Error(`Feature is expected to be ${value} but is ${current}`)
  }
}

Features.all = () => ({ ...features })
