import { ReactiveQueue } from 'meteor/jkuester:reactive-queue'
import { Random } from 'meteor/random'
import { check, Match } from 'meteor/check'

/**
 * The notify uses a reactive-queue in order to spawn notifications
 * based on any incoming data.
 */
export const Notify = {}

const queue = new ReactiveQueue()

const defaults = {
  type: 'primary',
  dismiss: true,
  autohide: true,
  delay: 3000,
  animation: true,
  icon: 'info-circle'
}

/**
 * Add a new notification to the query
 * @param notification {Object}
 * @param notification.type {String}
 * @param notification.subtitle {String|undefined}
 * @param notification.title {String|Function|undefined}
 * @param notification.icon {String|undefined}
 * @param notification.message {String|Function|undefined}
 * @param notification.autohide {Boolean|undefined}
 * @param notification.delay {Number|undefined}
 * @param notification.animation {Boolean|undefined}
 */
Notify.add = (notification) => {
  check(notification, Match.ObjectIncluding({
    type: String,
    title: Match.Maybe(Match.OneOf(String, Function)),
    subtitle: Match.Maybe(String),
    icon: Match.Maybe(String),
    message: Match.Maybe(Match.OneOf(String, Function)),
    dismiss: Match.Maybe(Boolean),
    autohide: Match.Maybe(Boolean),
    delay: Match.Maybe(Number),
    animation: Match.Maybe(Boolean)
  }))

  const id = Random.id(6)
  queue.enqueue({
    id,
    ...defaults,
    ...notification
  })
}

Notify.get = () => {
  return queue.dequeue()
}

Notify.isEmpty = () => queue.isEmpty()

Notify.remove = id => queue.delete(id)
