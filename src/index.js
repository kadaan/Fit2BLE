const fs = require('fs')
const {Command, flags} = require('@oclif/command')
const FitFileParser = require('fit-file-parser').default
const bleno = require('@abandonware/bleno')
const FtmsControlService = require('./ftms-control-service')
const FtmsService = require('./ftms-service')
const HeartrateService = require('./heartrate-service')

class Fit2BleCommand extends Command {
  constructor(argv, config) {
    super(argv, config)
    process.env.NOBLE_MULTI_ROLE = 1
    this.lastRecordTimestamp = 0
    this.lastSend = 0
    this.lastAltitude = null
    this.lastDistance = null
    this.data = null
    this.heartrateService = new HeartrateService()
    this.ftmsService = new FtmsService()
    this.ftmsControlService = new FtmsControlService()
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
      speedUnit: 'km/h',
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
      console.log(`bleno: on -> stateChange: ${state}`)
      if (state === 'poweredOn') {
        console.log(`bleno: enabling uuids: ${this.heartrateService.uuid} ${this.ftmsService.uuid}`)
        bleno.startAdvertising('Fit2Ble', [this.heartrateService.uuid, this.ftmsService.uuid])
      } else {
        bleno.stopAdvertising()
      }
    }.bind(this))

    bleno.on('advertisingStartError', function (error) {
      console.log(`bleno: on -> advertisingStartError: ${error}`)
    })

    bleno.on('advertisingStart', function (error) {
      console.log(`bleno: on -> advertisingStart: ${error ? 'error ' + error : 'success'}`)

      if (!error) {
        bleno.setServices([this.heartrateService, this.ftmsService], function (error) {
          console.log(`bleno: setServices: ${error ? 'error ' + error : 'success'}`)
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

    let heartRate = null
    let speed = null
    let power = null
    let cadence = null
    if ('heart_rate' in record) {
      heartRate = record.heart_rate
    }
    if ('speed' in record) {
      speed = record.speed
    }
    if ('power' in record) {
      power = record.power
    }
    if ('cadence' in record) {
      cadence = record.cadence
    }
    this.heartrateService.update(heartRate)
    this.ftmsService.update(heartRate, speed, cadence, power)

    let percentGrade = 0
    let rise = 0
    let run = 0
    if (this.lastAltitude !== null && this.lastDistance !== null && record.altitude !== null && record.distance !== null) {
      let incline = 0
      rise = record.altitude - this.lastAltitude
      run = record.distance - this.lastDistance
      if (run > 0) {
        incline = rise / run
      }
      percentGrade = incline * 100
      await this.ftmsControlService.setIncline(percentGrade)
    }
    let d = new Date(0) // The 0 there is the key, which sets the date to the epoch
    d.setUTCSeconds(recordTimestamp / 1000)
    // this.log(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds()},${percentGrade.toFixed(2)},${record.altitude.toFixed(2)}`)
    this.log(`timestamp: ${recordTimestamp}, timeDelta: ${recordTimeOffset}, hr: ${heartRate === null ? '-' : heartRate}, pwr: ${power === null ? '-' : power}, cad: ${cadence === null ? '-' : cadence}, spd: ${speed === null ? '-' : speed}, incline: ${percentGrade.toFixed(2)}`)
    if (record.altitude !== null) {
      this.lastDistance = record.distance
    }
    if (this.altitude !== null) {
      this.lastAltitude = record.altitude
    }
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
