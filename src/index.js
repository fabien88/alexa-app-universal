const app = require('./app');
const preMiddleware = require('./preMiddlewares');
const postMiddlewares = require('./postMiddlewares');
const translatorForLanguages = require('./controler/Translator');
const { dependencies } = require('./dependencies');

module.exports = {
  alexa: app,
  middlewares: { ...preMiddleware, ...postMiddlewares },
  dependencies,
  translatorForLanguages,
};
