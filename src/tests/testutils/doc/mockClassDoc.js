import { Random } from 'meteor/random'

export const mockClassDoc = async (options, collection) => {
  const classDoc = {
    _id: options._id ?? Random.id(),
    title: options.title ?? Random.id(),
    createdBy: options.createdBy,
    timeFrame: options.timeFrame,
    teachers: options.teacher,
    students: options.students
  }

  if (collection) {
    await collection.insertAsync(classDoc)
  }

  return classDoc
}
