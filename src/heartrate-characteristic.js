const bleno = require('@abandonware/bleno')

class HeartrateCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: '2A37',
      properties: ['read', 'notify'],
    })
    this.buffer = Buffer.alloc(2, 0)
  }

  update(heartRate) {
    this.buffer[1] = heartRate
  }

  onReadRequest(offset, callback) {
    console.log('bleno: HeartrateCharacteristic readRequest')
    if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null)
    } else {
      callback(this.RESULT_SUCCESS, this.buffer)
    }
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    console.log('bleno: HeartrateCharacteristic subscribe')
    this.notifyInterval = setInterval(function () {
      console.log('bleno: HeartrateCharacteristic update')
      updateValueCallback(this.buffer)
    }.bind(this), 1000)
  }

  onUnsubscribe() {
    console.log('bleno: HeartrateCharacteristic unsubscribe')
    if (this.notifyInterval) {
      clearInterval(this.notifyInterval)
      this.notifyInterval = null
    }
  }
}

module.exports = HeartrateCharacteristic
