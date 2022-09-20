import { Template } from 'meteor/templating'
import { getAllFontAwesomeIcons } from '../../utils/getAllFontAwesomeIcons'
import { dataTarget } from '../../utils/dataTarget'
import { asyncTimeout } from '../../../api/utils/asyncTimeout'
import { debounce } from '../../../api/utils/debounce'
import './iconSelect.html'
import './iconSelect.scss'
import './autoform'

Template.afIconSelect.setDependencies({})

Template.afIconSelect.onCreated(function () {
  const instance = this
  const allIcons = getAllFontAwesomeIcons()
  const allKeys = Object.keys(allIcons)

  instance.setDefault = () => {
    instance.state.set({ searchAvailable: false })
    setTimeout(() => instance.state.set({ icons: allKeys, searchAvailable: true }), 300)
  }

  instance.search = name => {
    const out = []
    const lowercaseName = name.toLowerCase()
    for (const key in allIcons) {
      if (key.includes(lowercaseName)) {
        out.push(key)
      }
    }
    return out
  }

  instance.setDefault()
})

Template.afIconSelect.onRendered(function () {
  const instance = this

  // at first we set the existing value,
  // for example in case this is an update form
  if (instance.data.value) {
    instance.state.set({ selectedIcon: instance.data.value })
    updateHiddenField(instance.data.value, instance)
  }

  // then we setup our intersection observer to prevent
  // blocking the main thread with rendering 1000+ icons...
  const options = {
    root: instance.lookup('.icon-select-container').get(0),
    rootMargin: '0px',
    threshold: 0.0
  }

  const byWhiteSpace = /\s+/g
  const classNames = 'btn btn-sm btn-outline-secondary border-0 select-icon-btn'.split(byWhiteSpace)
  const iconClassNames = 'fa fas fa-fw'.split(byWhiteSpace)
  const callback = (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return
      }

      // make sure to skip, in case observer.unobserved has not been reached yet
      const transformed = entry.target.getAttribute('data-transformed')
      if (transformed) {
        return
      }

      entry.target.classList.add(...classNames)
      entry.target.setAttribute('data-transformed', true)

      const first = entry.target.firstElementChild
      const name = entry.target.getAttribute('data-name')
      const icon = document.createElement('i')
      icon.classList.add(...iconClassNames)
      icon.classList.add(`fa-${name}`)
      entry.target.appendChild(icon)
      entry.target.removeChild(first)

      observer.unobserve(entry.target)
    })
  }

  instance.observer = new window.IntersectionObserver(callback, options)

  instance.autorun(() => {
    const icons = instance.state.get('icons')
    if (icons?.length > 0) {
      setTimeout(() => {
        const $nodes = instance.$('.icon-container')
        Object.values($nodes).forEach(node => {
          if (!(node instanceof window.Element)) {
            return
          }
          instance.observer.observe(node)
        })
      }, 500)
    }
  })
})

Template.afIconSelect.helpers({
  icons () {
    return Template.getState('icons')
  },
  searchAvailable () {
    return Template.getState('searchAvailable')
  },
  selectedIcon () {
    return Template.getState('selectedIcon')
  },
  inputAtts () {
    return Template.currentData().atts
  },
  setIcon () {
    return Template.getState('setIcon')
  }
})

Template.afIconSelect.onDestroyed(function () {
  this.observer.disconnect()
})

Template.afIconSelect.events({
  'click .select-icon-btn': async (event, templateInstance) => {
    event.preventDefault()
    const selectedIcon = dataTarget(event, templateInstance, 'name')
    updateHiddenField(selectedIcon, templateInstance)
    templateInstance.state.set('setIcon', true)
    await asyncTimeout(100)
    templateInstance.state.set({ selectedIcon })
    templateInstance.state.set('setIcon', false)
  },
  'input .search-icon-input': debounce(function (event, templateInstance) {
    const $search = templateInstance.lookup('.search-icon-input')
    const name = $search.val()
    if (!name?.length) {
      return templateInstance.setDefault()
    }
    if (name.length < 3) {
      return
    }
    const icons = templateInstance.search(name)
    templateInstance.state.set({ icons })
  }, 250)
})

const updateHiddenField = (name, templateInstance) => {
  const $hidden = templateInstance.lookup('.hidden-input')
  $hidden.val(name)
}
