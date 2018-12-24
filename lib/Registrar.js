"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Chromecast_1 = tslib_1.__importDefault(require("./Chromecast"));
var Register = (function () {
    function Register() {
    }
    Register.forConnectionEvents = function (listener) {
        return Chromecast_1.default.eventDelegate.registerConnectionEventListener(listener);
    };
    Register.forPlayerEvents = function (listener) {
        return Chromecast_1.default.eventDelegate.registerPlaybackEventListener(listener);
    };
    Register.forPlayerCapabilityEvents = function (listener) {
        return Chromecast_1.default.eventDelegate.registerPlayerCapabilityListener(listener);
    };
    Register.forQueueEvents = function (listener) {
        return Chromecast_1.default.eventDelegate.registerQueueEventListener(listener);
    };
    Register.forEvents = function (listener) {
        return Chromecast_1.default.eventDelegate.registerNativeEventListener(listener);
    };
    return Register;
}());
exports.default = Register;
