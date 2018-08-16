module.exports = {
  name: 'AMAZON.HelpIntent',
  handler: () => (request, response) => {
    const cancelOutput = 'Help';
    response.say(cancelOutput);
  },
};
