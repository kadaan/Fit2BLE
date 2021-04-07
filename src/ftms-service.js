const bleno = require('@abandonware/bleno')
const FtmsIndoorBikeDataCharacteristic = require('./ftms-indoor-bike-data-characteristic')
const FtmsFeatureCharacteristic = require('./ftms-feature-characteristic')
const FtmsStatusCharacteristic = require('./ftms-status-characteristic')

class FtmsService extends bleno.PrimaryService {
  constructor() {
    super({
      uuid: '1826',
      characteristics: [
        new FtmsStatusCharacteristic(),
        new FtmsFeatureCharacteristic(),
        new FtmsIndoorBikeDataCharacteristic(),
      ],
    })
    this.ftmsIndoorBikeDataCharacteristic = this.characteristics[2]
  }

  update(heartRate, speed, cadence, power) {
    if (heartRate !== null || speed !== null || cadence !== null || power !== null) {
      this.ftmsIndoorBikeDataCharacteristic.update(heartRate, speed, cadence, power)
    }
  }
}

module.exports = FtmsService
