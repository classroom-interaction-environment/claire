import { Meteor } from 'meteor/meteor'

export const SubscriptionRegistry = {}

const allSubs = new Map()

const getTemplateSubs = templateName => {
  const templateSubs = allSubs.get(templateName)

  if (!templateSubs) {
    throw new Error(`Expected Template ${templateName} to be registered.`)
  }

  return templateSubs
}

const validateName = name => {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Meteor.Error('subscription.error', 'subscription.invalidName', { name })
  }
}

SubscriptionRegistry.registerTemplate = function (name) {
  validateName(name)
  if (!allSubs.has(name)) {
    allSubs.set(name, new Set())
  }
  return SubscriptionRegistry
}

SubscriptionRegistry.add = function (templateName, subscriptionName) {
  validateName(templateName)
  const templateSubs = getTemplateSubs(templateName)
  templateSubs.add(subscriptionName)
  return SubscriptionRegistry
}

SubscriptionRegistry.remove = function (templateName, subscriptionName) {
  validateName(templateName)
  const templateSubs = getTemplateSubs(templateName)
  templateSubs.delete(subscriptionName)
  return SubscriptionRegistry
}

SubscriptionRegistry.getAll = function (templateName) {
  validateName(templateName)
  const templateSubs = getTemplateSubs(templateName)
  return templateSubs.values()
}
