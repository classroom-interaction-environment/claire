import { Template } from 'meteor/templating'
import { CodeInvitation } from '../../../../contexts/classroom/invitations/CodeInvitations'
import { SchoolClass } from '../../../../contexts/classroom/schoolclass/SchoolClass'
import { toLocaleDate } from '../../../../api/language/localeDate'
import './invitationRowRenderer.html'

const API = Template.invitationRowRenderer.setDependencies({
  contexts: [SchoolClass, CodeInvitation]
})

const { SchoolClassCollection } = API

Template.invitationRowRenderer.helpers({
  expirationDate (createdAt, days) {
    const offset = CodeInvitation.helpers.getOffset(new Date(createdAt), days)
    return toLocaleDate(offset)
  },
  getStatus (invitation) {
    return CodeInvitation.helpers.getStatus(invitation)
  },
  schoolClass (classId) {
    const classDoc = SchoolClassCollection.findOne(classId)
    return classDoc && classDoc.title
  },
  isExpired (invitationDoc) {
    return CodeInvitation.helpers.isExpired(invitationDoc)
  }
})
