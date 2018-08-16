/* eslint-disable */
const types = [require('./vegetable')];
/* eslint-enable */

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

module.exports = { getCustomSlotTypes };
