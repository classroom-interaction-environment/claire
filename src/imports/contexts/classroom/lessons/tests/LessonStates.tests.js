/* eslint-env mocha */
import { LessonStatesDefinitions } from '../LessonStatesDefinitions'
import { LessonStates } from '../LessonStates'
import { expect } from 'chai'

const mockDoc = (started, completed) => ({
  startedAt: started && new Date(),
  completedAt: completed && new Date()
})

describe('LessonStates', () => {
  const test = (fct, expectIdle, expectRunning, expectComplete) => {
    it(`returns ${expectIdle} on idle lesson`, () => {
      const lesson = mockDoc()
      expect(fct(lesson)).to.equal(expectIdle)
    })
    it(`returns ${expectRunning} on running lesson`, () => {
      const lesson = mockDoc(true)
      expect(fct(lesson)).to.equal(expectRunning)
    })
    it(`returns ${expectComplete} on complete lesson`, () => {
      const lesson = mockDoc(true, true)
      expect(fct(lesson)).to.equal(expectComplete)
    })
    it('throws on no input', () => {
      expect(() => fct()).to.throw()
    })
  }

  describe(LessonStates.canComplete.name, () => {
    test(LessonStates.canComplete, false, true, false)
  })
  describe(LessonStates.canStart.name, () => {
    test(LessonStates.canStart, true, false, false)
  })
  describe(LessonStates.canEdit.name, () => {
    test(LessonStates.canStart, true, false, false)
  })
  describe(LessonStates.canRestart.name, () => {
    test(LessonStates.canRestart, false, true, true)
  })
  describe(LessonStates.canResume.name, () => {
    test(LessonStates.canResume, false, false, true)
  })
  describe(LessonStates.canStop.name, () => {
    test(LessonStates.canStop, false, true, false)
  })
  describe(LessonStates.canToggle.name, () => {
    test(LessonStates.canToggle, false, true, true)
  })
  describe(LessonStates.isCompleted.name, () => {
    test(LessonStates.isCompleted, false, false, true)
  })
  describe(LessonStates.isIdle.name, () => {
    test(LessonStates.isIdle, true, false, false)
  })
  describe(LessonStates.isRunning.name, () => {
    test(LessonStates.isRunning, false, true, false)
  })
  describe(LessonStates.getState.name, () => {
    it('returns the correct state for idle', () => {
      const doc = mockDoc()
      const actual = LessonStates.getState(doc)
      expect(actual).to.deep.equal(LessonStatesDefinitions.idle)
    })
    it('returns the correct state for running', () => {
      const doc = mockDoc(true)
      const actual = LessonStates.getState(doc)
      expect(actual).to.deep.equal(LessonStatesDefinitions.running)
    })
    it('returns the correct state for completed', () => {
      const doc = mockDoc(true, true)
      const actual = LessonStates.getState(doc)
      expect(actual).to.deep.equal(LessonStatesDefinitions.completed)
    })
    it('throws on no input', () => {
      expect(() => LessonStates.getState()).to.throw()
    })
  })
})
