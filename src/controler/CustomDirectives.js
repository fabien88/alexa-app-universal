const https = require('https');
const url = require('url');

class CustomDirectives {
  constructor(request, response) {
    this.sayNow = (speech) => {
      const postData = {
        header: {
          requestId: request.data.request.requestId,
        },
        directive: {
          type: 'VoicePlayer.Speak',
          speech,
        },
      };

      const postDataJSON = Buffer.from(JSON.stringify(postData));
      const options = {
        hostname: url.parse(request.context.System.apiEndpoint).hostname,
        port: 443,
        path: '/v1/directives',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${request.context.System.apiAccessToken}`,
          'Content-Length': postDataJSON.length,
        },
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let buffer = '';
          res.on('data', (d) => {
            buffer += d;
          });
          res.on('end', () => {
            resolve(buffer);
          });
        });

        req.write(postDataJSON);
        req.on('error', err => reject(err));
      });
    };

    this.getFunctions = () => ({
      sayNow: this.sayNow,
    });
  }
}

module.exports = CustomDirectives;
