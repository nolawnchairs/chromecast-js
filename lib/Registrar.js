"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Chromecast_1 = tslib_1.__importDefault(require("./Chromecast"));
var Register = (function () {
    function Register() {
    }
    Register.forConnectionEvent = function (listener) {
        return Chromecast_1.default.eventDelegate.registerConnectionEventListener(listener);
    };
    Register.forPlayerEvent = function (listener) {
        return Chromecast_1.default.eventDelegate.registerPlaybackEventListener(listener);
    };
    Register.forPlayerCapabilityEvent = function (listener) {
        return Chromecast_1.default.eventDelegate.registerPlayerCapabilityListener(listener);
    };
    Register.forQueueEvent = function (listener) {
        return Chromecast_1.default.eventDelegate.registerQueueEventListener(listener);
    };
    Register.forNativeEvent = function (listener) {
        return Chromecast_1.default.eventDelegate.registerNativeEventListener(listener);
    };
    return Register;
}());
exports.default = Register;
