import { Template } from 'meteor/templating'
import { SchoolClass } from '../../../../contexts/classroom/schoolclass/SchoolClass'
import { toLocaleDate } from '../../../../api/language/localeDate'
import './invitationRowRenderer.html'
import { getInvitationOffset } from '../../../../contexts/classroom/invitations/validation/getInvitationOffset'
import { getInvitationStatus } from '../../../../contexts/classroom/invitations/validation/getInvitationStatus'
import { invitationExpired } from '../../../../contexts/classroom/invitations/validation/invitationExpired'

const API = Template.invitationRowRenderer.setDependencies({
  contexts: [SchoolClass]
})

const { SchoolClassCollection } = API

Template.invitationRowRenderer.helpers({
  expirationDate (createdAt, days) {
    const offset = getInvitationOffset(new Date(createdAt), days)
    return toLocaleDate(offset)
  },
  getStatus (invitation) {
    return getInvitationStatus(invitation)
  },
  schoolClass (classId) {
    const classDoc = SchoolClassCollection.findOne(classId)
    return classDoc?.title
  },
  isExpired (invitationDoc) {
    return invitationExpired(invitationDoc)
  }
})
