import { Random } from 'meteor/random'

export const createGroupDoc = ({
  title,
  createdBy,
  users,
  maxUsers,
  classId,
  unitId,
  phases,
  material,
  visible,
  isAdhoc
} = {}) => {
  const doc = {
    title: title ?? Random.id(6),
    createdBy: createdBy ?? Random.id(),
    users: users ?? [{ userId: Random.id(), role: Random.id(6) }],
    maxUsers: maxUsers ?? 0,
    isAdhoc: !!isAdhoc,
    unitId: unitId ?? Random.id()
  }

  if (classId) doc.classId = classId
  if (phases) doc.phases = phases
  if (material) doc.material = material
  if (visible) doc.visible = visible

  return doc
}
