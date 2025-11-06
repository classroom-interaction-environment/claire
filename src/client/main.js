import '../imports/startup/client'
import './main.html'

Template.body.onRendered(function() {
  document.documentElement.setAttribute('data-bs-theme', 'light');
});