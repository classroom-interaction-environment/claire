import { Random } from 'meteor/random'

export const createGroupDoc = ({ title, createdBy, users, maxUsers, lessonId, classId, unitId, phases, material, visible }) => {
  return {
    title: title ?? Random.id(6),
    createdBy: createdBy ?? Random.id(),
    users: users ?? [{ userId: Random.id(), role: Random.id(6) }],
    maxUsers: maxUsers ?? 0,
    classId: classId,
    unitId: unitId,
    lessonId: lessonId ?? Random.id(),
    phases: phases,
    material: material,
    visible: visible
  }
}
