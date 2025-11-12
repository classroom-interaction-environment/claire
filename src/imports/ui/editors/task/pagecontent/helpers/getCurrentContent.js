import { TaskDefinitions } from '../../../../../contexts/tasks/definitions/TaskDefinitions'

export const getCurrentContent = ({ task, currentIndex, header, footer }) => {
  if (header) return task?.header?.content
  if (footer) return task?.footer?.content

  const content = task?.pages?.[currentIndex]?.content
  if (!content) { return content }

  return content.filter(element => {
    return TaskDefinitions.helpers.isRegistered(element)
  })
}