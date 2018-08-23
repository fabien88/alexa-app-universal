const Database = require('./controler/Database');
const t = require('./controler/Translator');
const CustomDirectives = require('./controler/CustomDirectives');

const Slots = require('./model/Slots');

const builtInDependencies = {
  database: (tableName, region) => (...args) => ({
    database: new Database(tableName, region, ...args),
  }),
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

// Feed deps with params
const getDeps = (dependencies, ...args) => {
  let allDeps = {};

  // Mandatory deps
  allDeps = {
    ...allDeps,
    slots: new Slots(...args).getAllSlots(),
    ...new CustomDirectives(...args).getFunctions(),
    say: getSay(...args),
    intentName: getIntentName(...args),
    keepSessionOpen: (request, response) => response.shouldEndSession(false),
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
