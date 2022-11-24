import { Random } from 'meteor/random'

/**
 *
 * @param options {object}
 * @param options._master {boolean=}
 * @param options._id {string=}
 * @param options.title {string=}
 * @param options.createdBy {string=}
 * @param options.description {string=}
 * @param options.pocket {string=}
 * @param options.index {number=}
 * @param options.period {string=}
 * @param options.requirements {string=}
 * @param options.dimensions {[string]=}
 * @param options.objectives {[string]=}
 * @param options.links {[string]=}
 * @param options.embeds {[string]=}
 * @param options.images {[string]=}
 * @param options.audio {[string]=}
 * @param options.documents {[string]=}
 * @param options.videos {[string]=}
 * @param options.literature {[string]=}
 * @param options.tasks {[string]=}
 * @param options.phases {[string]=}
 * @param collection {Mongo.Collection=}
 * @returns {object}
 */
export const mockUnitDoc = (options = {}, collection) => {
  const unitDoc = {
    _id: options._id ?? Random.id(),
    title: options.title ?? Random.id(6),
    createdBy: options.createdBy,
    description: options.description,
    pocket: options.pocket ?? Random.id(),
    index: options.index ?? 0,
    dimensions: options.dimensions,
    period: options.period ?? 5,
    objectives: options.objectives,
    requirements: options.requirements,
    links: options.links,
    embeds: options.embeds,
    images: options.images,
    audio: options.audio,
    documents: options.documents,
    videos: options.videos,
    tasks: options.tasks,
    literature: options.literature,
    phases: options.phases,
  }

  if (options._master) {
    unitDoc._master = options._master
  }

  if (collection) {
    collection.insert(unitDoc)
  }

  return unitDoc
}
