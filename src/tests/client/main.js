/// /////////////////////////////////////////////////////////////////////
//
// INFRASTRUCTURE
//
/// /////////////////////////////////////////////////////////////////////
import '../../imports/infrastructure/collection/tests'
import '../../imports/infrastructure/context/tests'
import '../../imports/infrastructure/datastructures/tests'
import '../../imports/infrastructure/pipelines/tests'

/// /////////////////////////////////////////////////////////////////////
//
// DEFAULTS
//
/// /////////////////////////////////////////////////////////////////////
// we need to import the minimal defaults that are required for everything
// else to work properly

import '../../imports/startup/client/minimal/defaults'
import '../../imports/utils/tests/archUtils.test'
import '../../imports/contexts/beamer/tests'
import '../../imports/contexts/system/accounts/users/tests/UserUtils.tests'
import '../../imports/api/accounts/registration/tests/PasswordConfig.tests'
import '../../imports/api/accounts/registration/tests/registerUserSchema'
import '../../imports/contexts/classroom/invitations/tests/CodeInvitation.tests'
import '../../imports/contexts/classroom/lessons/tests/LessonStates.tests'
import '../../imports/contexts/classroom/lessons/tests/Lesson.tests'

import '../../imports/api/schema/tests/Resolvers.tests'

// UI
import '../../imports/ui/tests'
