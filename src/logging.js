const DISABLE_INSPECT = false;

const bindLogging = () => {
  if (DISABLE_INSPECT) {
    console.inspect = () => {};
  } else {
    console.inspect = console.log.bind(null, '[INSPECT]');
  }
  console.log = console.log.bind(null, '[LOG]');
  console.info = console.info.bind(null, '[INFO]');
  console.warn = console.warn.bind(null, '[WARN]');
  console.error = console.error.bind(null, '[ERROR]');
};

const benchFunction = func => async (...args) => {
  const startAt = Date.now();
  const res = await func(...args);
  const endAt = Date.now();
  if (endAt - startAt > 100) {
    console.inspect(`function ${func.name} in ${endAt - startAt}ms`);
  }
  return res;
};

module.exports = { bindLogging, benchFunction };
