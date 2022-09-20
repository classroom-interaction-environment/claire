import { ReactiveVar } from 'meteor/reactive-var'

export const Device = {}

Device.isMobile = new ReactiveVar()
Device.isDesktop = new ReactiveVar()
Device.isBeamer = new ReactiveVar()
