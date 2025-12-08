import { Meteor } from 'meteor/meteor'
import { ContextBuilder } from '../../../infrastructure/datastructures/ContextBuilder'
import { buildPipeline } from '../../../infrastructure/pipelines/server/buildPipeline'
import { createLog } from '../../../api/log/createLog'

ContextBuilder.buildAll(function (context) {
  const useDebug = Meteor.isDevelopment && context.debug
  buildPipeline(context, {
    collection: true,
    filesCollection: true,
    methods: true,
    publications: true,
    debug: Meteor.isTest || useDebug ? createLog({ name: context.name, type: 'debug'}) : undefined
  })
})
