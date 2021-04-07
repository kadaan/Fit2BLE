const bleno = require('@abandonware/bleno')
const HeartrateCharacteristic = require('./heartrate-characteristic')

class HeartrateService extends bleno.PrimaryService {
  constructor() {
    super({
      uuid: '180D',
      characteristics: [
        new HeartrateCharacteristic(),
      ],
    })
  }

  update(heartRate) {
    if (heartRate !== null) {
      this.characteristics[0].update(heartRate)
    }
  }
}

module.exports = HeartrateService
