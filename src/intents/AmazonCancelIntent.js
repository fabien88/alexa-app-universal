module.exports = {
  name: 'AMAZON.CancelIntent',
  handler: () => (request, response) => {
    const cancelOutput = 'Cancel';
    response.say(cancelOutput);
  },
};
