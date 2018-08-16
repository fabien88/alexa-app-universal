module.exports = {
  name: 'AMAZON.PauseIntent',
  handler: () => (request, response) => {
    response.say('Pause');
    response.audioPlayerStop();
  },
};
