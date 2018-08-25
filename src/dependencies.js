const R = require('ramda');
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

const getIntentName = (request) => {
  if (request.data.request.type === 'LaunchRequest') {
    return 'LaunchRequest';
  }
  const intent = request.data.request.intent || {};
  return intent.name;
};

// Feed deps with params
const getDeps = (dependencies, ...args) => {
  let allDeps = {};

  const keepSessionOpen = (request, response) => (keep = true) => response.shouldEndSession(!keep);

  // Mandatory deps
  allDeps = {
    ...allDeps,
    slots: new Slots(...args).getAllSlots(),
    ...new CustomDirectives(...args).getFunctions(),
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
