const Database = require('./controler/Database');
const t = require('./controler/Translator');
const CustomDirectives = require('./controler/CustomDirectives');

const Slots = require('./model/Slots');

const builtInDependencies = {
  database: tableName => (...args) => ({
    database: new Database(tableName, ...args),
  }),
  t,
};

// Feed deps with params
const getDeps = (dependencies, ...args) => {
  let allDeps = {};
  allDeps = { ...allDeps, slots: new Slots(...args).getAllSlots() };
  allDeps = { ...allDeps, ...new CustomDirectives(...args).getFunctions() };
  dependencies.forEach((dependencie) => {
    const initializedDependencie = dependencie(...args);
    console.inspect(`Initialized : ${Object.keys(initializedDependencie)}`);
    allDeps = { ...allDeps, ...initializedDependencie };
  });
  return allDeps;
};

module.exports = {
  getDeps,
  dependencies: builtInDependencies,
};
