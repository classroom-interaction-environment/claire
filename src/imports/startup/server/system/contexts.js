import { Admin } from '../../../contexts/system/accounts/admin/Admin'
import { Users } from '../../../contexts/system/accounts/users/User'
import { Errors } from '../../../contexts/system/errors/Errors'
import { Settings } from '../../../contexts/system/settings/Settings'
import { Version } from '../../../contexts/system/version/Version'
import { systemPipeline } from '../../../contexts/system/systemPipeline'
import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'
import { buildPipeline } from '../../../infrastructure/pipelines/server/buildPipeline'
import { System } from '../../../contexts/system/System'

const buildOptions = {
  collection: true,
  methods: true,
  publications: true
}

// For System contexts, we can simply run a loop and apply the piplines directly
// , because there are no further pipelines applied to them.

System.info('<<< run pipelines >>>')
;[Admin, Users, Errors, Settings, Version].forEach(context => {
  systemPipeline(context)
  buildPipeline(context, buildOptions)
  ContextRegistry.add(context)
})
