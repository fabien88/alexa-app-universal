const objectZip = (keys, values) => keys.reduce(
  (others, key, index) => ({
    ...others,
    [key]: values[index],
  }),
  {},
);

const objectPromise = async obj => objectZip(Object.keys(obj), await Promise.all(Object.values(obj)));

module.exports = { objectPromise };
