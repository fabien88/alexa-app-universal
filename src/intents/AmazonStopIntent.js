module.exports = {
  name: 'AMAZON.StopIntent',
  handler: () => (request, response) => {
    const stopOutput = 'Stop';
    response.say(stopOutput);
    response.audioPlayerStop();
  },
};
