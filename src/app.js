const alexa = require('alexa-app');
const R = require('ramda');
const fs = require('fs');
const Slots = require('./model/Slots');
const { bindLogging, benchFunction } = require('./logging');
const { getDeps } = require('./dependencies');
const { objectPromise } = require('./util');

const getSayOK = ({ t, say }) => () => say(t('OK'));

const getApp = ({
  languageId = 'en',
  preMiddlewares,
  postMiddlewares,
  intents,
  launchIntent,
  dependencies,
  types,
  loadSchema = false,
}) => {
  const getNextSlotFilled = ({ options, slots, intent }) => {
    if (intent.denied) {
      return 'intentDenied';
    }
    if (intent.confirmed) {
      return 'intentConfirmed';
    }
    const slotKeys = Object.keys(options.slots);
    const events = ['initied'];
    for (let i = 0; i < slotKeys.length; ++i) {
      const slotKey = slotKeys[i];
      const slot = slots[slotKey];
      const eventsLength = events.length;
      if (!R.isNil(slot.userValue)) {
        events.push(`${slotKey}Filled`);
        if (slot.confirmed) {
          events.push(`${slotKey}Confirmed`);
        }
        if (slot.denied) {
          events.push(`${slotKey}Denied`);
        }
      }

      if (eventsLength === events.length && !options.slots[slotKey].optional) {
        break;
      }
    }
    return R.last(events);
  };

  const delegateTo = (deps, ...args) => (intentName, delegateParams) => {
    const filteredIntents = intents.filter(({ name }) => name === intentName);
    if (filteredIntents.length === 0 || filteredIntents.length > 1) {
      throw new Error(
        `No intent or more than two handler found for : ${intentName}`,
      );
    }
    const filteredIntent = filteredIntents[0];
    return filteredIntent.handler({
      ...deps,
      sayOK: getSayOK(deps),
      slots: new Slots(...args, {
        options: filteredIntent.options,
      }).getAllSlots(),
      delagated: true,
      delegateParams,
      delegateTo: delegateTo(deps, ...args),
    })(...args);
  };

  const getCustomSlotTypes = language => types.map(({ name, values, flatValues }) => ({
    name,
    values: flatValues
      ? flatValues[language]
      : Object.keys(values).map((id) => {
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

  const superHandler = ({ options, handler }) => async (...args) => {
    // activate logging tags for lambda/cloudwatch
    let exception = null;
    bindLogging();

    const getTypeMatcher = (type) => {
      const [request] = args;
      const lg = request.data.request.locale.substring(0, 2);
      const equalsToType = R.equals(type);
      const { values, flatValues } = R.filter(
        R.compose(
          equalsToType,
          R.prop('name'),
        ),
      )(types)[0];
      const valueToId = {};
      const localType = flatValues
        ? {}
        : Object.keys(values).map((id) => {
          values[id][lg].forEach((value) => {
            valueToId[value] = id;
          });
          return {
            id,
            values: values[id][lg],
          };
        });

      const getId = value => valueToId[value];
      return { getId };
    };

    // Get deps
    let deps = await objectPromise(getDeps(dependencies, ...args, { options }));
    deps = {
      ...deps,
      sayOK: getSayOK(deps),
      getTypeMatcher,
    };
    try {
      console.inspect('Executing PreHandler');
      deps = { ...deps, delegateTo: delegateTo(deps, ...args) };
      const preResults = await middlewareWithDepsExecutor(
        preMiddlewares,
        deps,
        ...args,
      );
      // Refresh deps, preHandler might have loaded some interesting values
      const refreshedDeps = await objectPromise(
        getDeps(dependencies, ...args, { options }),
      );
      deps = { ...deps, ...refreshedDeps, getTypeMatcher };
      // In 2 steps /!\ needed
      deps = { ...deps, delegateTo: delegateTo(deps, ...args) };

      if (!R.any(R.equals(false))(preResults)) {
        console.inspect('Executing Handler');
        const slotEvent = getNextSlotFilled({
          options,
          intent: deps.intent,
          slots: deps.slots,
        });

        const handleFunc = handler(deps);
        if (handleFunc[slotEvent]) {
          await handleFunc[slotEvent](...args);
        } else {
          if (R.type(handleFunc) !== 'Function') {
            throw new Error(`Missing event handler for : ${slotEvent}`);
          }
          await handleFunc(...args);
        }
      }
    } catch (e) {
      exception = e;
    }
    console.inspect('Executing PostHandler');
    await middlewareWithDepsExecutor(
      postMiddlewares,
      deps,
      ...args,
      null,
      exception,
    );
  };

  // Inject dependencies into intents and apply all intents
  const intentWithDeps = ({ name, options, handler }) => ({
    name,
    options,
    handler: superHandler({ name, options, handler }),
  });

  const applyIntent = ({ name, options, handler }) => app.intent(name, options, handler);
  R.map(
    R.compose(
      applyIntent,
      intentWithDeps,
    ),
    getIntents(languageId),
  );

  app.launch(superHandler({ options: {}, handler: getLaunchIntent().handler }));

  // app.audioPlayer('PlaybackFinished', (request, response) => {
  //   response.audioPlayerClearQueue();
  // });

  if (loadSchema) {
    const customSlotTypes = getCustomSlotTypes(languageId);
    R.map(
      R.compose(
        ([...args]) => app.customSlot(...args),
        ({ name, values }) => [name, values],
      ),
      customSlotTypes,
    );
  }

  return {
    app,
    invocationName: getLaunchIntent(languageId).invocationName,
  };
};

const writeSchema = ({
  modelDirPath, language, languageId, options,
}) => {
  const { app, invocationName } = getApp({
    ...options,
    languageId,
    loadSchema: true,
  });
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
