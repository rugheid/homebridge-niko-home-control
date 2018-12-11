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

    niko.listActions().then(function (response) {
        platform.log("Actions List", response);
        if (response.data) {
            for (let i = 0; i < response.data.length; i++) {
                let action = response.data[i];
                let uuid = UUIDGen.generate(accessoryName);

                var newAccessory = new Accessory(action.name, uuid);
                newAccessory.on('identify', function(paired, callback) {
                    platform.log(newAccessory.displayName, "Identify!!!");
                    callback();
                });

                let service = null;
                let serviceName = "Lightbulb";
                if (action.name.indexOf('Ventilator') > -1) {
                    service = Service.Fan;
                    serviceName = "Fan"
                } else {
                    service = Service.Lightbulb;
                }

                newAccessory.addService(service, serviceName)
                    .getCharacteristic(Characteristic.On)
                    .on('set', function(value, callback) {
                        platform.log(newAccessory.displayName, "Light -> " + value);
                        niko.executeActions(action.id, value).then(function (response) {
                            platform.log(newAccessory.displayName, response);
                            callback();
                        });
                    });

                this.accessories.push(newAccessory);
                this.api.registerPlatformAccessories("homebridge-niko-home-control", "NikoHomeControl", [newAccessory]);
            }
        }
    });
}

// Function invoked when homebridge tries to restore cached accessory.
// Developer can configure accessory at here (like setup event handler).
// Update current value.
NikoHomeControl.prototype.configureAccessory = function(accessory) {
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

// Handler will be invoked when user try to config your plugin.
// Callback can be cached and invoke when necessary.
NikoHomeControl.prototype.configurationRequestHandler = function(context, request, callback) {
    this.log("Context: ", JSON.stringify(context));
    this.log("Request: ", JSON.stringify(request));

    // Check the request response
    if (request && request.response && request.response.inputs && request.response.inputs.name) {
        this.addAccessory(request.response.inputs.name);

        // Invoke callback with config will let homebridge save the new config into config.json
        // Callback = function(response, type, replace, config)
        // set "type" to platform if the plugin is trying to modify platforms section
        // set "replace" to true will let homebridge replace existing config in config.json
        // "config" is the data platform trying to save
        callback(null, "platform", true, {"platform":"NikoHomeControl", "otherConfig":"SomeData"});
        return;
    }

    // - UI Type: Input
    // Can be used to request input from user
    // User response can be retrieved from request.response.inputs next time
    // when configurationRequestHandler being invoked

    var respDict = {
        "type": "Interface",
        "interface": "input",
        "title": "Add Accessory",
        "items": [
            {
                "id": "name",
                "title": "Name",
                "placeholder": "Fancy Light"
            }//, 
        // {
        //   "id": "pw",
        //   "title": "Password",
        //   "secure": true
        // }
    ]
    }

    // - UI Type: List
    // Can be used to ask user to select something from the list
    // User response can be retrieved from request.response.selections next time
    // when configurationRequestHandler being invoked

    // var respDict = {
    //   "type": "Interface",
    //   "interface": "list",
    //   "title": "Select Something",
    //   "allowMultipleSelection": true,
    //   "items": [
    //     "A","B","C"
    //   ]
    // }

    // - UI Type: Instruction
    // Can be used to ask user to do something (other than text input)
    // Hero image is base64 encoded image data. Not really sure the maximum length HomeKit allows.

    // var respDict = {
    //   "type": "Interface",
    //   "interface": "instruction",
    //   "title": "Almost There",
    //   "detail": "Please press the button on the bridge to finish the setup.",
    //   "heroImage": "base64 image data",
    //   "showActivityIndicator": true,
    // "showNextButton": true,
    // "buttonText": "Login in browser",
    // "actionURL": "https://google.com"
    // }

    // Plugin can set context to allow it track setup process
    context.ts = "Hello";

    // Invoke callback to update setup UI
    callback(respDict);
}

// Sample function to show how developer can add accessory dynamically from outside event
/**
    * Adds a new accessory to the platform.
    * - accessoryName: The name of the accessory.
    * - service: A Service object describing the service to use for the accessory.
    *      Examples are Service.Lightbulb and Service.Fan
    */
    NikoHomeControl.prototype.addAccessory = function(accessoryName, service) {
        this.log("Add Accessory");
        var platform = this;
        var uuid;

        uuid = UUIDGen.generate(accessoryName);

        var newAccessory = new Accessory(accessoryName, uuid);
        newAccessory.on('identify', function(paired, callback) {
            platform.log(newAccessory.displayName, "Identify!!!");
            callback();
        });
        // Plugin can save context on accessory to help restore accessory in configureAccessory()
        // newAccessory.context.something = "Something"

        // Make sure you provided a name for service, otherwise it may not visible in some HomeKit apps
  newAccessory.addService(service, "Switch")
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    platform.log(newAccessory.displayName, "Light -> " + value);
// TODO: Call action
    callback();
  });

  this.accessories.push(newAccessory);
        this.api.registerPlatformAccessories("homebridge-niko-home-control", "NikoHomeControl", [newAccessory]);
    }

NikoHomeControl.prototype.updateAccessoriesReachability = function() {
    this.log("Update Reachability");
    for (var index in this.accessories) {
        var accessory = this.accessories[index];
        accessory.updateReachability(false);
    }
}

// Sample function to show how developer can remove accessory dynamically from outside event
NikoHomeControl.prototype.removeAccessory = function() {
    this.log("Remove Accessory");
    this.api.unregisterPlatformAccessories("homebridge-niko-home-control", "NikoHomeControl", this.accessories);

    this.accessories = [];
}
