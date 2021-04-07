const bleno = require('@abandonware/bleno')

class FtmsIndoorBikeDataCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: '2AD2',
      properties: ['read', 'notify'],
    })
    this.updateValueCallback = null
    this.buffer = Buffer.alloc(9, 0)
    this.buffer[0] = 0x44
    this.buffer[1] = 0x02
    this.readonlyBuffer = Buffer.alloc(9, 0)
    this.readonlyBuffer[0] = 0x44
    this.readonlyBuffer[1] = 0x02
  }

  update(heartRate, speed, cadence, power) {
    if (speed === null) {
      this.buffer[2] = 0
      this.buffer[3] = 0
    } else {
      speed /= 0.01
      this.buffer[2] = speed & 0xFF
      this.buffer[3] = speed >> 8
    }
    if (cadence === null) {
      this.buffer[4] = 0
      this.buffer[5] = 0
    } else {
      cadence /= 0.5
      this.buffer[4] = cadence & 0xFF
      this.buffer[5] = cadence >> 8
    }
    if (power === null) {
      this.buffer[6] = 0
      this.buffer[7] = 0
    } else {
      this.buffer[6] = power & 0xFF
      this.buffer[7] = power >> 8
    }
    if (heartRate === null) {
      this.buffer[8] = 0
    } else {
      this.buffer[8] = heartRate
    }
    let swapBuffer = this.readonlyBuffer
    this.readonlyBuffer = this.buffer
    this.buffer = swapBuffer
  }

  onReadRequest(offset, callback) {
    console.log('bleno: FtmsIndoorBikeDataCharacteristic readRequest')
    if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null)
    } else {
      callback(this.RESULT_SUCCESS, this.buffer)
    }
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    console.log('bleno: FtmsIndoorBikeDataCharacteristic subscribe')
    this.notifyInterval = setInterval(function () {
      console.log('bleno: FtmsIndoorBikeDataCharacteristic update')
      updateValueCallback(this.buffer)
    }.bind(this), 1000)
  }

  onUnsubscribe() {
    console.log('bleno: FtmsIndoorBikeDataCharacteristic unsubscribe')
    if (this.notifyInterval) {
      clearInterval(this.notifyInterval)
      this.notifyInterval = null
    }
  }
}

module.exports = FtmsIndoorBikeDataCharacteristic
