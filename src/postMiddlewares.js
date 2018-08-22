const logExceptionMiddleware = ({ t, say }) => (
  request,
  response,
  type,
  exception,
) => {
  if (exception) {
    console.error(exception);
    say(t('ERROR') || 'error');
    try {
      console.error(exception.stack.split('\n'));
    } catch (e) {}
  }
};

const inspectReqAndResMiddleware = () => (request, response) => {
  console.inspect(JSON.stringify({ request, response }, null, 2));
};

const setUserSesssion = ({ user }) => (request, response) => {
  const session = request.getSession();
  session.set('USER_SESSION', user);
  response.prepare();
};

const persistUserSession = ({ database, user }) => (request) => {
  const { userId } = request;
  database.writeUserData(userId, user);
};

module.exports = {
  logExceptionMiddleware,
  setUserSesssion,
  persistUserSession,
  inspectReqAndResMiddleware,
};
