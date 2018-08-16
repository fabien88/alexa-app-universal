/* eslint-disable */
const intents = [
  require('./AmazonCancelIntent'),
  require('./AmazonHelpIntent'),
  require('./AmazonPauseIntent'),
  require('./AmazonResumeIntent'),
  require('./AmazonStartOverIntent'),
  require('./AmazonStopIntent'),
  require('./NoMotivationIntent'),
];
/* eslint-enable */

const launchIntent = require('./LaunchIntent');

const getIntents = language => intents.map(({ name, options, handler }) => ({
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

module.exports = { getIntents, getLaunchIntent };
