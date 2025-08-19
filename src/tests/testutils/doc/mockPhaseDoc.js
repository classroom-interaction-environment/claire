import { Random } from 'meteor/random'

/**
 *
 * @param options {object}
 * @param options._id {string=}
 * @param options.title {string=}
 * @param options.createdBy {string=}
 * @param options.period {number=}
 * @param options.unit {string}
 * @param collection {Mongo.Collection=}
 * @return {object}
 */
export const mockPhaseDoc = (options = {}, collection) => {
  const phaseDoc = {
    _id: options._id ?? Random.id(),
    createdBy: options.createdBy,
    title: options.title ?? Random.id(),
    period: options.period ?? 5,
    unit: options.unit,
    plot: options.plot,
    socialState: options.socialState,
    method: options.method,
    references: options.references,
    notes: options.notes
  }

  if (options._master) {
    phaseDoc._master = options._master
  }

  if (collection) {
    collection.insert(phaseDoc)
  }

  return phaseDoc
}
