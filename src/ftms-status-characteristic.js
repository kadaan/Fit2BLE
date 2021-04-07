const bleno = require('@abandonware/bleno')

class FtmsStatusCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: '0x2ADA',
      properties: ['read', 'notify'],
    })
    this.buffer = Buffer.alloc(8, 0)
  }

  onReadRequest(offset, callback) {
    console.log('bleno: FtmsStatusCharacteristic readRequest')
    if (offset) {
      callback(this.RESULT_ATTR_NOT_LONG, null)
    } else {
      callback(this.RESULT_SUCCESS, this.buffer)
    }
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    console.log('bleno: FtmsStatusCharacteristic subscribe')
    this.notifyInterval = setInterval(function () {
      console.log('bleno: FtmsStatusCharacteristic update')
      updateValueCallback(this.buffer)
    }.bind(this), 1000)
  }

  onUnsubscribe() {
    console.log('bleno: FtmsStatusCharacteristic unsubscribe')
    if (this.notifyInterval) {
      clearInterval(this.notifyInterval)
      this.notifyInterval = null
    }
  }
}

module.exports = FtmsStatusCharacteristic
