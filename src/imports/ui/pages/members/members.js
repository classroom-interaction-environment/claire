import './members.html'
import memberslang from './memberslang'

Template.members.setDependencies({
  language: memberslang
})

Template.members.helpers({
  members () {
    return [
      {
        title: 'Kurs angelegt',
        details: 'Jahrgang 2024/2025',
        by: 'Sarah Super',
        date: new Date(),
        icon: 'users',
        email: 'ssuper@p-sachsen.de'
      },
      {
        title: 'Unterricht durchgeführt',
        details: 'Kommunikation in der Pflege',
        by: 'Benjamin Pause',
        date: new Date(),
        icon: 'flag',
        email: 'bpause@p-sachsen.de'
      },
      {
        title: 'Material angelegt',
        details: 'Powerpoint "Interkulturelle Kompetenz"',
        by: 'Linda Lehrerin',
        date: new Date(),
        icon: 'file',
        email: 'llehrerin@p-sachsen.de'
      },
      {
        title: 'Unterricht gestarted',
        details: 'Umgang mit Demenzpatienten',
        by: 'Mark Heckmann',
        date: new Date(),
        icon: 'rocket',
        email: 'mheckmann@p-sachsen.de'
      },
      {
        title: 'Unterricht angelegt',
        details: 'Kritische reflexion des eigenen Handelns',
        by: 'Berta Bleistift',
        date: new Date(),
        icon: 'book',
        email: 'bbleistift@p-sachsen.de'
      },
      {
        title: 'Material angelegt',
        details: 'Umfrage zur Arbeitsbelastung',
        by: 'Jan Küster',
        date: new Date(),
        icon: 'chart-bar',
        email: 'jkuester@p-sachsen.de'
      }]
  }
})