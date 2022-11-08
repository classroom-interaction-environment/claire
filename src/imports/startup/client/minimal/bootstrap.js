import { Meteor } from 'meteor/meteor'
import { Settings } from '../../../contexts/system/settings/Settings'
import { setFatalError } from '../../../ui/components/fatal/fatal'
import { callMethod } from '../../../ui/controllers/document/callMethod'
import { CurriculumSession } from '../../../ui/curriculum/CurriculumSession'

const themes = {
  default: {
    id: 'theme-default',
    url: Meteor.absoluteUrl('default.css')
  },
  curriculum: {
    id: 'theme-curriculum',
    url: Meteor.absoluteUrl('curriculum.css')
  }
}

Meteor.defer(async () => {
  await import('bootstrap')
  global.Popper = await import('popper.js')

  const settingsDoc = await callMethod({
    name: Settings.methods.get,
    failure: setFatalError
  })

  const currentTheme = settingsDoc?.ui?.theme
  await import('./custom.scss')

  if (!currentTheme || currentTheme === 'caroDefault') {
    let currentIsCurriculum = false

    const enable = ({ id, url }) => {
      for (const style of document.styleSheets) {
        if (style.href === url && style.disabled) {
          style.disabled = false
          return
        }
      }
      console.debug('[Theme]: enable', id, url)
      const link = document.createElement('link')
      link.setAttribute('id', id)
      link.setAttribute('rel', 'stylesheet')
      link.setAttribute('href', url)
      document.head.appendChild(link)
    }

    const disable = ({ url }) => {
      for (const style of document.styleSheets) {
        if (style.href === url) {
          style.disabled = true
          return
        }
      }
    }

    CurriculumSession.onStateChange(isCurriculum => {
      console.debug('[CurriculumSession]: onState changed', { isCurriculum, currentIsCurriculum })
      // switch to curriculum
      if (isCurriculum && !currentIsCurriculum) {
        enable(themes.curriculum)
        disable(themes.default)
        currentIsCurriculum = true
      }

      // switch to default
      if (!isCurriculum && currentIsCurriculum) {
        enable(themes.default)
        disable(themes.curriculum)
        currentIsCurriculum = false
      }
    })

    enable(themes.default)
  }
  else {
    const style = document.createElement('style')
    style.textContent = currentTheme
    document.head.appendChild(style)
  }
})
