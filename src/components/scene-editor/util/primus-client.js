import { defaultEventMap, defaultServiceMethods } from '@feathersjs/feathers'
import { Service } from '@feathersjs/transport-commons/client'

export default function primusClient(connection, options) {
  if (!connection) {
    throw new Error('Primus connection needs to be provided')
  }

  const defaultService = function (this, name) {
    const events = Object.values(defaultEventMap)
    const settings = Object.assign({}, options, {
      name,
      connection,
      method: 'send'
    })
    return new Service(settings)
  }

  const initialize = function (app) {
    if (app.primus !== undefined) {
      throw new Error('Only one default client provider can be configured')
    }

    app.primus = connection
    app.defaultService = defaultService
    app.mixins.unshift((service, _location, options) => {
      if (options && options.methods && service instanceof Service) {
        const customMethods = options.methods.filter((name) => !defaultServiceMethods.includes(name))

        service.methods(...customMethods)
      }
    })
  }

  initialize.Service = Service
  initialize.service = defaultService

  return initialize
}

if (typeof module !== 'undefined') {
  module.exports = Object.assign(primusClient, module.exports)
}
