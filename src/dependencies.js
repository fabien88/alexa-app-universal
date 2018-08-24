const R = require('ramda');
const Database = require('./controler/Database');
const t = require('./controler/Translator');
const CustomDirectives = require('./controler/CustomDirectives');
const Slots = require('./model/Slots');

const getTypeMatcher = (...args) => (type) => {
  const [request] = args;
  const lg = request.data.request.locale;
  const equalsToType = R.equals(type);
  const { values, flatValues } = R.filter(equalsToType(R.prop('name')))(
    type,
  )[0];
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

const builtInDependencies = {
  database: (tableName, region) => (...args) => ({
    database: new Database(tableName, region, ...args),
  }),
  getTypeMatcher,
  t,
};

const getIntentName = (request, response) => {
  if (request.data.request.type === 'LaunchRequest') {
    return 'LaunchRequest';
  }
  const intent = request.data.request.intent || {};
  return intent.name;
};

const getSay = (request, response) => {
  const say = response.say && response.say.bind(response);
  return (...args) => {
    if (args.length === 0 || !args[0]) {
      return say && say(...args);
    }
    console.log({ say: args[0] });
    return say && say(...args);
  };
};

const keepSessionOpen = (request, response) => {
  const shouldEndSession = response.shouldEndSession.bind(response);
  return (keep = true) => shouldEndSession(!keep);
};

// Feed deps with params
const getDeps = (dependencies, ...args) => {
  let allDeps = {};

  // Mandatory deps
  allDeps = {
    ...allDeps,
    getTypeMatcher: getTypeMatcher(...args),
    slots: new Slots(...args).getAllSlots(),
    ...new CustomDirectives(...args).getFunctions(),
    say: getSay(...args),
    intentName: getIntentName(...args),
    keepSessionOpen: keepSessionOpen(...args),
  };

  dependencies.forEach((dependencie) => {
    const initializedDependencie = dependencie(...args);
    allDeps = { ...allDeps, ...initializedDependencie };
  });
  return allDeps;
};

module.exports = {
  getDeps,
  dependencies: builtInDependencies,
};
