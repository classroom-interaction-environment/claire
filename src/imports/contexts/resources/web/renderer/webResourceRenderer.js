import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { ContextRegistry } from '../../../../infrastructure/context/ContextRegistry'
import { isMaterial } from '../../../material/isMaterial'
import { getMaterialRenderer } from '../../../../api/material/getMaterialRenderer'
import './webResourceRenderer.html'

const previewCache = new ReactiveDict()

Template.webResourceRenderer.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const { meta } = data
    const ctx = ContextRegistry.get(meta)
    const renderer = isMaterial(ctx)
      ? getMaterialRenderer(ctx.material)
      : ctx.renderer
    const { template, load } = renderer

    load()
      .catch(error => instance.state.set({ error }))
      .then(() => instance.state.set({ [meta]: template }))
  })
})

Template.webResourceRenderer.helpers({
  subtemplateData (document = {}) {
    const { meta } = document
    const templateName = Template.getState(meta)
    if (!templateName) return

    const options = { previewData: previewCache.get(document.url) }
    return {
      template: templateName,
      data: Object.assign({}, document, options)
    }
  },
  showLicense ({ license, licenseOwner } = {}) {
    return Boolean(license || licenseOwner)
  }
})
