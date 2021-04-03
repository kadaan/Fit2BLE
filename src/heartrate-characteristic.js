const bleno = require('@abandonware/bleno')

class HeartrateCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: '2A37',
      properties: ['read', 'notify'],
    })
    this.notifyInterval = null
    this.heartrate = 0
  }

  setHeartRate(heartrate) {
    this.heartrate = heartrate
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    console.log('HeartrateCharacteristic subscribe')

    this.counter = 0
    this.notifyInterval = setInterval(function () {
      console.log('HeartrateCharacteristic update value: ' + this.counter)
      updateValueCallback(Buffer.from([this.heartrate]))
      this.counter++
    }.bind(this), 1000)
  }

  onUnsubscribe() {
    console.log('HeartrateCharacteristic unsubscribe')

    if (this.notifyInterval) {
      clearInterval(this.notifyInterval)
      this.notifyInterval = null
    }
  }

  onReadRequest(offset, callback) {
    callback(this.RESULT_SUCCESS, Buffer.from([this.heartrate]))
  }
}

module.exports = HeartrateCharacteristic
