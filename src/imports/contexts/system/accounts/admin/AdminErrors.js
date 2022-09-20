export const AdminErrors = {
  CREATE_REQUIRE_USERNAME: 'admin.methods.createUser.requiresUsername',
  CREATE_REQUIRE_EMAIL: 'admin.methods.createUser.requiresEmail',
  CREATE_REQUIRE_PASSWORD: 'admin.methods.createUser.requiresPassword',
  CREATE_REQUIRE_ROLE: 'admin.methods.createUser.requiresRole',
  REMOVE_ADMIN_NOT_EXIST: 'admin.methods.common.notExist',
  REMOVE_USER_NOT_EXISTS: 'admin.methods.common.notExist',
  MAKE_ADMIN_NO_USER: 'admin.methods.common.notExists',
  REMOVE_ADMIN_NO_USER: 'admin.methods.common.notExists',
  ACCESS_DENIED_NO_ADMIN: 'admin.methods.permission.notAdmin',
  ACCESS_DENIED_NO_USER: 'admin.methods.permission.notUser',
  USER_NOT_CREATED: 'admin.methods.error.userNotCreated',
  USER_NOT_ADDED: 'admin.methods.error.userNotAdded',
  USER_NOT_LIFTED: 'admin.methods.error.userNotLifted',
  INSUFFICIENT_ARGUMENTS: 'admin.methods.error.insufficientArgs',
  FORCE_ADMIN: 'admin.methods.error.enforceAdmin',
  USER_NOT_FOUND: 'admin.methods.error.userNotFound'
}
