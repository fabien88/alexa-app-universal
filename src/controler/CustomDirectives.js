const https = require('https');
const url = require('url');
const R = require('ramda');

const regexDot = new RegExp('.*(\\?|\\s|\\!|\\>|\\.)$');

class CustomDirectives {
  constructor(request, response) {
    const say = response.say && response.say.bind(response);
    const reprompt = response.reprompt && response.reprompt.bind(response);
    this.regexDot = regexDot;
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
          speech: `${speech}`,
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

    this.sendDialogDirective = (
      directive,
      updatedSlots = {},
      reset = false,
    ) => {
      const updatedIntent = request.data.request.intent || {};
      updatedIntent.slots = updatedIntent.slots || {};
      if (reset) {
        Object.keys(updatedIntent.slots).forEach((key) => {
          updatedIntent.slots[key] = {
            value: null,
            name: key,
            confirmationStatus: 'NONE',
          };
        });
      }
      Object.keys(updatedSlots || {}).forEach((key) => {
        const slot = updatedSlots[key];
        if (!updatedIntent.slots[key]) {
          updatedIntent.slots[key] = {};
        }
        updatedIntent.slots[key].value = slot;
        updatedIntent.slots[key].confirmationStatus = 'NONE';
      });
      updatedIntent.confirmationStatus = 'NONE';
      response.directive({
        ...directive,
        updatedIntent,
      });
      return response.shouldEndSession(false);
    };

    this.delegateDialog = (updatedSlots, unused, reset) => this.sendDialogDirective(
      {
        type: 'Dialog.Delegate',
      },
      updatedSlots,
      reset,
    );

    this.elicitSlot = (targetSlot, updatedSlots, reset) => this.sendDialogDirective(
      {
        type: 'Dialog.ElicitSlot',
        slotToElicit: targetSlot,
      },
      { ...updatedSlots, [targetSlot]: null },
      reset,
    );

    this.confirmSlot = (targetSlot, updatedSlots, reset) => this.sendDialogDirective(
      {
        type: 'Dialog.ConfirmSlot',
        slotToConfirm: targetSlot,
      },
      updatedSlots,
      reset,
    );

    this.confirmIntent = (updatedSlots, unused, reset) => this.sendDialogDirective(
      {
        type: 'Dialog.ConfirmIntent',
      },
      updatedSlots,
      reset,
    );

    this.wipeSlots = () => {
      const updatedIntent = request.data.request.intent || { slots: {} };
      Object.keys(updatedIntent.slots).forEach((key) => {
        updatedIntent.slots[key] = {
          value: null,
          name: key,
          confirmationStatus: 'NONE',
        };
      });
    };

    this.getSay = () => (...args) => {
      if (args.length === 0 || !args[0]) {
        return say && say(...args);
      }
      let toSay = args[0];
      if (R.type(toSay) === 'Array') {
        toSay = toSay[Math.floor(Math.random() * toSay.length)];
      }
      console.log({ say: toSay });
      if (toSay.match(regexDot)) {
        return say && say(toSay);
      }
      return say && say(`${toSay}. `);
    };

    this.getFunctions = () => ({
      sayNow: this.sayNow,
      say: this.getSay(),
      reprompt,
      getAddress: this.getAddress,
      dialog: {
        delegate: this.delegateDialog,
        elicitSlot: this.elicitSlot,
        confirmSlot: this.confirmSlot,
        confirmIntent: this.confirmIntent,
        wipeSlots: this.wipeSlots,
        state: request.getDialog().dialogState,
      },
      intent: {
        denied:
          request.data.request.intent
          && request.data.request.intent.confirmationStatus === 'DENIED',
        confirmed:
          request.data.request.intent
          && request.data.request.intent.confirmationStatus === 'CONFIRMED',
      },
    });
  }
}

module.exports = CustomDirectives;
