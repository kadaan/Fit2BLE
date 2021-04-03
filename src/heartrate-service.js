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

  setHeartRate(heartRate) {
    this.characteristics[0].setHeartRate(heartRate)
  }
}

module.exports = HeartrateService
