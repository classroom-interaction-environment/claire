import { Meteor } from 'meteor/meteor'
import { ContextBuilder } from '../../../infrastructure/datastructures/ContextBuilder'
import { buildPipeline } from '../../../infrastructure/pipelines/server/buildPipeline'

ContextBuilder.buildAll(function (context) {
  const useDebug = Meteor.isDevelopment && context.debug
  buildPipeline(context, {
    collection: true,
    filesCollection: true,
    methods: true,
    publications: true,
    debug: useDebug
  })
})
