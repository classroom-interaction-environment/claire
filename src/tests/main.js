import { onClientExec, onServerExec } from '../imports/api/utils/archUtils'
import { initLanguage } from '../imports/api/language/initLanguage'

before(async function () {
  await initLanguage('en')
})

onClientExec(function () {
  import './client/main'
})

onServerExec(function () {
  import './server'
})
