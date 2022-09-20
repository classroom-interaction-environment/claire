import { Meteor } from 'meteor/meteor'
import { Lesson } from '../../contexts/classroom/lessons/Lesson'
import { defaultCallback } from '../utils/defaultCallback'
import { callMethod } from './document/callMethod'

export const LessonActions = {}

LessonActions.start = ({ _id, failure, success }) => callMethod({
  name: Lesson.methods.start,
  args: { _id },
  failure: failure,
  success: success
})

LessonActions.complete = ({ _id, failure, success }) => callMethod({
  name: Lesson.methods.complete,
  args: { _id },
  failure: failure,
  success: success
})

LessonActions.restart = ({ _id, failure, success }) => callMethod({
  name: Lesson.methods.restart,
  args: { _id },
  failure: failure,
  success: success
})

LessonActions.toggle = ({ _id, referenceId, context }, callback) => Meteor.call(Lesson.methods.toggle.name, {
  _id,
  referenceId,
  context
}, defaultCallback(callback))
