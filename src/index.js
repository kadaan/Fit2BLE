const fs = require('fs')
const {Command, flags} = require('@oclif/command')
const FitFileParser = require('fit-file-parser').default
const bleno = require('@abandonware/bleno')
const HeartrateService = require('./heartrate-service')

class Fit2BleCommand extends Command {
  constructor(argv, config) {
    super(argv, config)
    this.lastRecordTimestamp = 0
    this.lastSend = 0
    this.data = null
    this.heartrateService = new HeartrateService()
  }

  async run() {
    const {args} = this.parse(Fit2BleCommand)

    const inputFile = fs.readFileSync(args.file, null)
    if (!inputFile || !inputFile.buffer) {
      this.log(`Could not read the file or it does not exists: ${args.file}`)
      return
    }

    const fitFileParser = new FitFileParser({
      force: true,
      speedUnit: 'm/s',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: false,
      mode: 'both',
    })
    fitFileParser.parse(inputFile.buffer, (error, data) => {
      if (error !== null) {
        this.error(error, {exit: true})
      }
      this.data = data
    })

    bleno.on('stateChange', function (state) {
      console.log(`on -> stateChange: ${state}`)

      if (state === 'poweredOn') {
        console.log(`enabling uuid: ${this.heartrateService.uuid}`)

        bleno.startAdvertising('Fit2Ble', [this.heartrateService.uuid])
      } else {
        bleno.stopAdvertising()
      }
    }.bind(this))

    bleno.on('advertisingStart', function (error) {
      console.log(`on -> advertisingStart: ${error ? 'error ' + error : 'success'}`)

      if (!error) {
        bleno.setServices([this.heartrateService], function (error) {
          console.log(`setServices: ${error ? 'error ' + error : 'success'}`)
        })
      }
    }.bind(this))

    for (let record of this.data.records) {
      // eslint-disable-next-line no-await-in-loop
      await this.processFitRecord(record)
    }
  }

  async processFitRecord(record) {
    let recordTimestamp = record.timestamp.getTime()
    let recordTimeOffset = 0
    if (this.lastRecordTimestamp > 0) {
      recordTimeOffset = recordTimestamp - this.lastRecordTimestamp
    }
    this.lastRecordTimestamp = recordTimestamp
    let timeToSleep = 0
    let nextSend = 0
    let now = 0
    if (this.lastSend > 0) {
      nextSend = this.lastSend + recordTimeOffset
      now = new Date().getTime()
      timeToSleep = nextSend - now
    }
    if (timeToSleep > 0) {
      await this.sleep(timeToSleep)
    }
    this.log(`now: ${now}, recordTimestamp: ${recordTimestamp}, lastRecordTimestamp: ${this.lastRecordTimestamp}, recordTimeOffset: ${recordTimeOffset}, lastSend: ${this.lastSend}, nextSend: ${nextSend}, timeToSleep: ${timeToSleep}`)
    this.heartrateService.setHeartRate(record.heart_rate)
    this.lastSend = new Date().getTime()
  }

  sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }
}

Fit2BleCommand.description = `Describe the command here
...
Extra documentation goes here
`

Fit2BleCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
}

Fit2BleCommand.args = [
  {name: 'file', required: true},
]

module.exports = Fit2BleCommand
