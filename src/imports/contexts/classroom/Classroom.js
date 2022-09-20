import { createContextRegistry } from '../../infrastructure/datastructures/createContextRegistry'

export const Classroom = createContextRegistry({
  name: 'Classroom',
  setIdentity (context) {
    context.isClassroom = true
  },
  hasIdentity (context) {
    return context.isClassroom === true
  }
})
