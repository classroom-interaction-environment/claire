import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Settings } from '../../../contexts/system/settings/Settings'
import { Version } from '../../../contexts/system/version/Version'
import { AppImages } from '../../../contexts/files/image/AppImages'
import lozad from 'lozad'
import './footer.html'

import { getCollection } from '../../../api/utils/getCollection'

Template.footer.onCreated(function () {
  const instance = this

  instance.autorun(computation => {
    const version = instance.state.get('version')
    if (!version) {
      Meteor.call(Version.methods.get.name, (err, res) => {
        if (err) {
          console.error(err)
        }
        instance.state.set('version', res)
        computation.stop()
      })
    }
  })

  instance.autorun(computation => {
    const settingsDoc = Settings.helpers.get()
    if (!settingsDoc) return

    const legalLinks = Object.values(Settings.legal).filter(field => settingsDoc[field] && settingsDoc[field].length > 0)
    instance.state.set({ legalLinks })
    computation.stop()
  })

  instance.autorun(computation => {
    if (!Meteor.userId()) return
    const appImages = AppImages.helpers.get()
    const settingsDoc = Settings.helpers.get()
    if (!appImages || !settingsDoc || !settingsDoc.logos) return

    const { logos } = settingsDoc
    if (logos) {
      const AppImageFiles = getCollection(AppImages.name).filesCollection
      const footerLogos = logos.map(logoId => {
        const logoFile = appImages.find(doc => doc._id === logoId)
        logoFile.url = AppImageFiles.link(logoFile)
        return logoFile
      })
      instance.state.set({ footerLogos })
    }
  })
})

Template.footer.onRendered(function () {
  const el = document.querySelectorAll('.lozad')
  const observer = lozad(el, {
    root: document.querySelector('.footer-root-container'),
    rootMargin: '10px 0px', // syntax similar to that of CSS Margin
    threshold: 1.0, // ratio of element convergence
    load: function (el) {
      const $el = global.$(el)
      $el.prop('src', $el.data('src'))
    }
  })
  observer.observe()
})

Template.footer.helpers({
  version () {
    const version = Template.getState('version')
    return version && version.tag && version.commit ? version : null
  },
  legalLinks () {
    return Template.getState('legalLinks')
  },
  legalLabel (field) {
    const context = Settings.schema[field]
    return context && context.label?.()
  },
  logos () {
    return Template.getState('footerLogos')
  }
})
