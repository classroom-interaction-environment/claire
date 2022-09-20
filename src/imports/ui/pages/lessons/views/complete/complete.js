import { Template } from 'meteor/templating'

import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import '../../../../renderer/lesson/list/lessonListRenderer'
import './complete.html'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'

Template.completeLessons.helpers({
  completedLessons () {
    return getLocalCollection(Lesson.name).find({ completedAt: { $exists: true } }, {
      sort: { completedAt: -1 }
    })
  }
})
