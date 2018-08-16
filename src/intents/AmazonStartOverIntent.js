module.exports = {
  name: 'AMAZON.StartOverIntent',
  handler: ({ player }) => (request, response) => {
    const { offsetInMilliseconds } = request.data.context.AudioPlayer;
    player.play(offsetInMilliseconds);
    response.say('OK');
  },
};
