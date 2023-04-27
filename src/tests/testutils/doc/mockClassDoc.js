import { Random } from 'meteor/random'

export const mockClassDoc = (options, collection) => {
  const classDoc = {
    _id: options._id ?? Random.id(),
    title: options.title ?? Random.id(),
    createdBy: options.createdBy,
    timeFrame: options.timeFrame,
    teachers: options.teacher,
    students: options.students
  }

  if (collection) {
    collection.insert(classDoc)
  }

  return classDoc
}
