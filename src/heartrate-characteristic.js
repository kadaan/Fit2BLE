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

  onReadRequest(offset, callback) {
    console.log('bleno: HeartrateCharacteristic readRequest');
    if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null)
    } else {
      callback(this.RESULT_SUCCESS, Buffer.from([0, this.heartrate]));
    }
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    console.log('bleno: HeartrateCharacteristic subscribe')

    this.counter = 0
    this.notifyInterval = setInterval(function () {
      console.log('bleno: HeartrateCharacteristic update value: ' + this.counter)
      updateValueCallback(Buffer.from([0, this.heartrate]))
      this.counter++
    }.bind(this), 1000)
  }

  onUnsubscribe() {
    console.log('bleno: HeartrateCharacteristic unsubscribe')

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
