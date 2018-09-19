const AlexaUtterances = require('alexa-utterances');
const R = require('ramda');

const removeSpaces = R.replace(/^\s+|\s+$|\s+(?=\s)/g, '');

const generateUtterances = (utterances) => {
  const samples = [];
  R.forEach((utterance) => {
    R.map(
      sample => samples.push(removeSpaces(sample)),
      AlexaUtterances(utterance, [], [], []),
    );
  }, utterances);

  return R.uniq(samples).sort();
};
module.exports = generateUtterances;
