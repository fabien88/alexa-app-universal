const https = require('https');
const url = require('url');

class CustomDirectives {
  constructor(request, response) {
    this.sayNow = (speech) => {
      if (!speech) {
        return true;
      }
      console.log({ sayNow: speech });
      const postData = {
        header: {
          requestId: request.data.request.requestId,
        },
        directive: {
          type: 'VoicePlayer.Speak',
          speech: `${speech}. `,
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

    this.getAddress = () => {
      const { deviceId } = request.context.System.device;

      const options = {
        hostname: url.parse(request.context.System.apiEndpoint).hostname,
        port: 443,
        path: `/v1/devices/${deviceId}/settings/address`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${request.context.System.apiAccessToken}`,
        },
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let buffer = '';
          res.on('data', (d) => {
            buffer += d;
          });
          res.on('end', () => {
            try {
              const addressResponse = JSON.parse(buffer);
              if (addressResponse && addressResponse.type === 'FORBIDDEN') {
                return reject(new Error('User is not allowed to read address'));
              }
              return resolve(addressResponse);
            } catch (e) {
              return reject(e);
            }
          });
        });
        req.end();
        req.on('error', err => reject(err));
      });
    };

    this.sendDialogDirective = (directive, updatedSlots = {}) => {
      const updatedIntent = request.data.request.intent || { slots: {} };
      Object.keys(updatedSlots).forEach((key) => {
        const slot = updatedSlots[key];
        if (!updatedIntent.slots[key]) {
          updatedIntent.slots[key] = {};
        }
        updatedIntent.slots[key].value = slot;
      });

      response.directive({
        ...directive,
        updatedIntent,
      });
      return response.shouldEndSession(false);
    };

    this.delegateDialog = updatedSlots => this.sendDialogDirective(
      {
        type: 'Dialog.Delegate',
      },
      updatedSlots,
    );

    this.elicitSlot = (targetSlot, updatedSlots) => this.sendDialogDirective(
      {
        type: 'Dialog.ElicitSlot',
        slotToElicit: targetSlot,
      },
      updatedSlots,
    );

    this.confirmSlot = (targetSlot, updatedSlots) => this.sendDialogDirective(
      {
        type: 'Dialog.ConfirmSlot',
        slotToConfirm: targetSlot,
      },
      updatedSlots,
    );

    this.confirmIntent = updatedSlots => this.sendDialogDirective(
      {
        type: 'Dialog.ConfirmIntent',
      },
      updatedSlots,
    );

    this.getFunctions = () => ({
      sayNow: this.sayNow,
      getAddress: this.getAddress,
      delegateDialog: this.delegateDialog,
      elicitSlot: this.elicitSlot,
      confirmSlot: this.confirmSlot,
      confirmIntent: this.confirmIntent,
    });
  }
}

module.exports = CustomDirectives;
