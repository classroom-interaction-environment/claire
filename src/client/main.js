import '../imports/startup/client'
import './main.html'

if (Blaze.setExceptionHandler) Blaze.setExceptionHandler(console.error)
if (Template.stateName) Template.stateName('state')
