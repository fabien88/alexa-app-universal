const alexa = require('alexa-app');
const R = require('ramda');
const fs = require('fs');
const { bindLogging, benchFunction } = require('./logging');
const { getDeps } = require('./dependencies');
const { objectPromise } = require('./util');

const getApp = ({
  languageId = 'en',
  preMiddlewares,
  postMiddlewares,
  intents,
  launchIntent,
  dependencies,
  types,
}) => {
  const delegateTo = (deps, ...args) => (intentName) => {
    const filteredIntents = intents.filter(({ name }) => name === intentName);
    console.log({ intentName, filteredIntents });
    return filteredIntents.map(intent => intent.handler(deps)(...args));
  };

  const getCustomSlotTypes = language => types.map(({ name, values }) => ({
    name,
    values: Object.keys(values).map((id) => {
      const [value, ...synonyms] = values[id][language];
      return {
        id,
        value,
        synonyms,
      };
    }),
  }));

  const getIntents = language => intents
    .filter(({ noPublish }) => !noPublish) // Filter out internal intents
    .map(({ name, options, handler }) => ({
      name,
      options: {
        ...options,
        utterances: options && options.utterances[language],
      },
      handler,
    }));

  const getLaunchIntent = language => ({
    handler: launchIntent.handler,
    invocationName: launchIntent.invocationName[language],
  });

  const app = new alexa.app();

  // Will execute middlewares with deps
  const middlewareWithDepsExecutor = (middlewares, deps, ...args) => Promise.all(
    R.map(
      middleware => benchFunction(R.curry(middleware)(deps))(...args),
      middlewares,
    ),
  );

  const superHandler = handler => async (...args) => {
    // activate logging tags for lambda/cloudwatch
    bindLogging();

    // Get deps
    let deps = await objectPromise(getDeps(dependencies, ...args));
    console.inspect('Executing PreHandler');
    await middlewareWithDepsExecutor(preMiddlewares, deps, ...args);

    // Refresh deps, preHandler might have loaded some interesting values
    deps = await objectPromise(getDeps(dependencies, ...args));

    deps = { ...deps, delegateTo: delegateTo(deps, ...args) };

    console.inspect('Executing Handler');
    await benchFunction(R.curry(handler)(deps))(...args);

    console.inspect('Executing PostHandler');
    await middlewareWithDepsExecutor(postMiddlewares, deps, ...args);
  };

  // Inject dependencies into intents and apply all intents
  const intentWithDeps = ({ name, options, handler }) => ({
    name,
    options,
    handler: superHandler(handler),
  });

  const applyIntent = ({ name, options, handler }) => app.intent(name, options, handler);
  R.map(
    R.compose(
      applyIntent,
      intentWithDeps,
    ),
    getIntents(languageId),
  );

  app.launch(superHandler(getLaunchIntent().handler));

  app.audioPlayer('PlaybackFinished', (request, response) => {
    response.audioPlayerClearQueue();
  });

  const customSlotTypes = getCustomSlotTypes(languageId);
  R.map(
    R.compose(
      ([...args]) => app.customSlot(...args),
      ({ name, values }) => [name, values],
    ),
    customSlotTypes,
  );

  return {
    app,
    invocationName: getLaunchIntent(languageId).invocationName,
  };
};

const writeSchema = ({
  modelDirPath, language, languageId, options,
}) => {
  const { app, invocationName } = getApp({ ...options, languageId });
  const model = app.schemas.askcli(invocationName);
  const filePath = `${modelDirPath}/${language}.json`;
  fs.writeFile(filePath, model, (err) => {
    if (err) {
      return console.log(err);
    }
    console.log(`${filePath} saved`);
    return true;
  });
};

const writeSchemas = (modelDirPath, languagesWithId, options) => {
  languagesWithId.forEach(languageWidthId => writeSchema({ ...languageWidthId, modelDirPath, options }));
};

module.exports = {
  writeSchemas,
  writeSchema,
  getApp,
};
