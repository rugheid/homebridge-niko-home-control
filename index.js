const niko = require('niko-home-control');
const Accessory, Service, Characteristic, UUIDGen;

/*
 * Sample config:
 * {
 *      "ip": "192.168.0.5", (IP address of Niko Home Control API, required)
 *      "port": 8000, (port of Niko Home Control API, default 8000)
 *      "events": false (whether events should be processed, default true)
 * }
 */

module.exports = function(homebridge) {
    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-niko-home-control", "NikoHomeControl", NikoHomeControlPlatform, true);
}

// Platform constructor
// config may be null
// api may be null if launched from old homebridge version
function NikoHomeControlPlatform(log, config, api) {
    log("NikoHomeControlPlatform Init");
    var platform = this;
    this.log = log;
    this.config = config;
    this.accessories = [];

    niko.init({
        ip: config.ip;
        port: config.port || 8000,
        timeout: 20000,
        events: config.events || true
    });
}

// Function invoked when homebridge tries to restore cached accessory.
// Developer can configure accessory at here (like setup event handler).
// Update current value.
SamplePlatform.prototype.configureAccessory = function(accessory) {
  this.log(accessory.displayName, "Configure Accessory");
  // var platform = this;
  //
  // // Set the accessory to reachable if plugin can currently process the accessory,
  // // otherwise set to false and update the reachability later by invoking 
  // // accessory.updateReachability()
  // accessory.reachable = true;
  //
  // accessory.on('identify', function(paired, callback) {
  //   platform.log(accessory.displayName, "Identify!!!");
  //   callback();
  // });
  //
  // if (accessory.getService(Service.Lightbulb)) {
  //   accessory.getService(Service.Lightbulb)
  //   .getCharacteristic(Characteristic.On)
  //   .on('set', function(value, callback) {
  //     platform.log(accessory.displayName, "Light -> " + value);
  //     callback();
  //   });
  // }
  //
  // this.accessories.push(accessory);
}


