const logMiddleware = () => (request, response, type) => {
  if (type === 'LaunchRequest') {
    console.info({ requestType: type });
    return;
  }
  if (type === 'IntentRequest') {
    const intent = request.data.request.intent || {};
    console.info({
      intent: intent.name,
      confirmationStatus: request.confirmationStatus,
    });
  }
};

const recoverSessionFromDBMiddleware = ({ database }) => async (request) => {
  const { userId } = request;
  const session = request.getSession();
  let userSession = session.get('USER_SESSION');
  console.log({ userId });
  console.inspect({ fromSession: userSession });
  // We fetch session from DB only if needed
  if (!userSession) {
    userSession = await database.readUserData(userId);
    session.set('USER_SESSION', userSession);
  }
};

module.exports = {
  logMiddleware,
  recoverSessionFromDBMiddleware,
};
