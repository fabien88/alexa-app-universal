const app = require('./app');
const preHandler = require('./preMiddlewares');
const postHandler = require('./postMiddlewares');
const { dependencies } = require('./dependencies');

module.exports = {
  alexa: app,
  middlewares: { ...preHandler, ...postHandler },
  dependencies,
};
