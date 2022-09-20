import { PermissionDeniedError } from './PermissionDeniedError'

export class NotInRolesError extends PermissionDeniedError {
  constructor (details) {
    super(PermissionDeniedError.notInRole, details)
  }
}
