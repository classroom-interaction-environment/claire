export default class H5PUser {
  constructor ({ _id, username, emails, type = 'local', privileges } = {}) {
    this.id = _id // '1'
    this.name = username // 'Firstname Surname'
    this.email = emails?.[0]?.address // 'mail@example.com'
    this.canInstallRecommended = privileges?.canInstallRecommended || false
    this.canUpdateAndInstallLibraries = privileges?.canUpdateAndInstallLibraries || false
    this.canCreateRestricted = privileges?.canCreateRestricted || false
    this.type = type // 'local'
  }
}
