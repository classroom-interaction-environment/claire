import { DDP } from 'meteor/ddp-client'
import { NotInMethodError } from '../errors/types/NotInMethodError'

/**
 * Will be dropped, due to dropping fibers
 * @deprecated
 */
export const InvocationChecker = {}

InvocationChecker.NotInMethodError = NotInMethodError

InvocationChecker.ensureMethodInvocation = function ensureMethodInvocation () {
  if (!DDP._CurrentMethodInvocation.get()) {
    throw new NotInMethodError()
  }
}
