"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Chromecast_1 = tslib_1.__importDefault(require("./Chromecast"));
var Register = (function () {
    function Register() {
    }
    Register.forCastEvents = function (handler) {
        return Chromecast_1.default.eventDelegate.registerCastEventListener(handler);
    };
    Register.forPlaybackEvents = function (handler) {
        return Chromecast_1.default.eventDelegate.registerPlaybackEventListener(handler);
    };
    Register.forPlayerCapabilityEvents = function (handler) {
        return Chromecast_1.default.eventDelegate.registerPlayerCapabilityListener(handler);
    };
    Register.forQueueEvents = function (handler) {
        return Chromecast_1.default.eventDelegate.registerQueueEventListener(handler);
    };
    Register.forEvents = function (handler) {
        return Chromecast_1.default.eventDelegate.registerNativeEventListener(handler);
    };
    Register.unregisterAll = function () {
        Chromecast_1.default.eventDelegate.removeAll();
    };
    return Register;
}());
exports.default = Register;
