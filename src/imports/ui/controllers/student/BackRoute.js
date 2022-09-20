import { ReactiveVar } from 'meteor/reactive-var'

const _backRoute = new ReactiveVar()
const _cache = {}

export const BackRoute = {
  set ({ path, title }) {
    _backRoute.set({ path, title })
  },
  get () {
    return _backRoute.get()
  },
  flush () {
    _backRoute.set(null)
  },
  cache ({ path, title }) {
    _cache.path = path
    _cache.title = title
  },
  fromCache () {
    const { path } = _cache
    if (!path) {
      return BackRoute.flush()
    }
    const { title } = _cache
    delete _cache.path
    delete _cache.title
    _backRoute.set({ path, title })
  }
}
