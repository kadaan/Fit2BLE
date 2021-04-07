const noble = require('@abandonware/noble')

class FtmsControlService {
  constructor() {
    this.uuid = '0x1826'
    this.characteristic = null
    noble.on('stateChange', async function (state) {
      console.log(`noble: on -> stateChange: ${state}`)
      if (state === 'poweredOn') {
        await noble.startScanningAsync([this.uuid], false)
      } else {
        await noble.stopScanningAsync()
      }
    }.bind(this))

    noble.on('discover', async function (peripheral) {
      await noble.stopScanningAsync()
      await peripheral.connectAsync()
      const {characteristics} = await peripheral.discoverSomeServicesAndCharacteristicsAsync(['1826'], ['2AD9'])
      this.characteristic = characteristics[0]
      peripheral.on('disconnect', async function (_) {
        console.log('noble: on -> stateChange: disconnect')
        await noble.startScanningAsync([this.uuid], false)
      })
    }.bind(this))
  }

  async setIncline(incline) {
    if (this.characteristic !== null) {
      let data = new DataView(new ArrayBuffer(2))
      data.setInt16(0, incline, false)
      let buffer = new Uint8Array([17, 0, 0, data.getInt8(0), data.getInt8(1), 0, 0, 0])
      await this.characteristic.writeAsync(buffer, true)
    }
  }
}

module.exports = FtmsControlService
