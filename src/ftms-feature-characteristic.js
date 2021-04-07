const bleno = require('@abandonware/bleno')

class FtmsFeatureCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: '2ACC',
      properties: ['read', 'notify'],
    })
    this.buffer = Buffer.from([0, 0, 0, 0, 12, 224, 0, 0])
  }

  onReadRequest(offset, callback) {
    console.log('bleno: FtmsFeatureCharacteristic readRequest')
    if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null)
    } else {
      callback(this.RESULT_SUCCESS, this.buffer)
    }
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    console.log('bleno: FtmsFeatureCharacteristic subscribe')
    this.notifyInterval = setInterval(function () {
      console.log('bleno: FtmsFeatureCharacteristic update')
      updateValueCallback(this.buffer)
    }.bind(this), 1000)
  }

  onUnsubscribe() {
    console.log('bleno: FtmsFeatureCharacteristic unsubscribe')
    if (this.notifyInterval) {
      clearInterval(this.notifyInterval)
      this.notifyInterval = null
    }
  }
}

module.exports = FtmsFeatureCharacteristic
