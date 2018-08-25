const defaultUser = {
  firstConnection: Date.now(),
  launchCount: 0,
  tutorialsFlags: {
    intro: 0,
    help: 0,
  },
};

class Slots {
  constructor(request, response, { options }) {
    const slots = options.slots || {};
    this.allSlots = {};
    // Default value for all slots
    Object.keys(slots).forEach((slotKey) => {
      this.allSlots[slotKey] = {};
    });
    Object.keys(request.slots).forEach((slotKey) => {
      const slot = request.slots[slotKey];
      const result = {};
      result.resolutions = slot.resolutions;

      result.firstResolution = result.resolutions && slot.resolutions[0];
      result.matched = result.firstResolution && result.firstResolution.isMatched();
      result.userValue = slot.value;
      result.confirmed = slot.confirmationStatus === 'CONFIRMED';
      result.denied = slot.confirmationStatus === 'DENIED';

      if (result.matched) {
        const { name, id } = result.firstResolution.first();
        result.id = id;
        result.value = name;
      }
      this.allSlots[slot.name] = result;
    });
  }

  getAllSlots() {
    return this.allSlots;
  }
}

module.exports = Slots;
