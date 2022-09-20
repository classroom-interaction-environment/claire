/* eslint-env mocha */
import { LessonStatesDefinitions } from '../LessonStatesDefinitions'
import { LessonStates } from '../LessonStates'
import { expect } from 'chai'

const mockDoc = (started, completed) => ({
  startedAt: started && new Date(),
  completedAt: completed && new Date()
})

describe('LessonStates', function () {
  const test = (fct, expectIdle, expectRunning, expectComplete) => {
    it(`returns ${expectIdle} on idle lesson`, function () {
      const lesson = mockDoc()
      expect(fct(lesson)).to.equal(expectIdle)
    })
    it(`returns ${expectRunning} on running lesson`, function () {
      const lesson = mockDoc(true)
      expect(fct(lesson)).to.equal(expectRunning)
    })
    it(`returns ${expectComplete} on complete lesson`, function () {
      const lesson = mockDoc(true, true)
      expect(fct(lesson)).to.equal(expectComplete)
    })
    it('throws on no input', function () {
      expect(() => fct()).to.throw()
    })
  }

  describe(LessonStates.canComplete.name, function () {
    test(LessonStates.canComplete, false, true, false)
  })
  describe(LessonStates.canStart.name, function () {
    test(LessonStates.canStart, true, false, false)
  })
  describe(LessonStates.canEdit.name, function () {
    test(LessonStates.canStart, true, false, false)
  })
  describe(LessonStates.canRestart.name, function () {
    test(LessonStates.canRestart, false, true, true)
  })
  describe(LessonStates.canResume.name, function () {
    test(LessonStates.canResume, false, false, true)
  })
  describe(LessonStates.canStop.name, function () {
    test(LessonStates.canStop, false, true, false)
  })
  describe(LessonStates.canToggle.name, function () {
    test(LessonStates.canToggle, false, true, true)
  })
  describe(LessonStates.isCompleted.name, function () {
    test(LessonStates.isCompleted, false, false, true)
  })
  describe(LessonStates.isIdle.name, function () {
    test(LessonStates.isIdle, true, false, false)
  })
  describe(LessonStates.isRunning.name, function () {
    test(LessonStates.isRunning, false, true, false)
  })
  describe(LessonStates.getState.name, function () {
    it('returns the correct state for idle', function () {
      const doc = mockDoc()
      const actual = LessonStates.getState(doc)
      expect(actual).to.deep.equal(LessonStatesDefinitions.idle)
    })
    it('returns the correct state for running', function () {
      const doc = mockDoc(true)
      const actual = LessonStates.getState(doc)
      expect(actual).to.deep.equal(LessonStatesDefinitions.running)
    })
    it('returns the correct state for completed', function () {
      const doc = mockDoc(true, true)
      const actual = LessonStates.getState(doc)
      expect(actual).to.deep.equal(LessonStatesDefinitions.completed)
    })
    it('throws on no input', function () {
      expect(() => LessonStates.getState()).to.throw()
    })
  })
})
