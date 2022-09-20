module.exports = {
  settings: {
    code: 'de',
    isoCode: 'de-DE',
    icon: '🇩🇪',
    name: 'Deutsch',
    localeDateOptions: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      // weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h24'
      // timeZoneName: 'none',
    }
  },
  load: () => import('../../../../resources/i18n/de')
}
