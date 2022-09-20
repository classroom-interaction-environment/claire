import { onClientExec, onServerExec } from '../imports/api/utils/archUtils'

onClientExec(function () {
  import './client/main'

})

onServerExec(function () {
  import './server'
})
