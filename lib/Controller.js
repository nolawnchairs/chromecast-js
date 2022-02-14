"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Chromecast_1 = (0, tslib_1.__importDefault)(require("./Chromecast"));
var MediaControllerInstance = (function () {
    function MediaControllerInstance() {
    }
    MediaControllerInstance.prototype.togglePlay = function () {
        Chromecast_1.default.controller.playOrPause();
    };
    MediaControllerInstance.prototype.toggleMute = function () {
        Chromecast_1.default.controller.muteOrUnmute();
    };
    MediaControllerInstance.prototype.seek = function (seconds) {
        Chromecast_1.default.player.currentTime = Chromecast_1.default.player.currentTime + seconds;
        Chromecast_1.default.controller.seek();
    };
    MediaControllerInstance.prototype.seekToTime = function (seconds) {
        var duration = Chromecast_1.default.player.duration;
        if (seconds > duration)
            throw new Error("Controller::seekToTime - Cannot seek beyond duration bounds; max value is ".concat(duration));
        Chromecast_1.default.player.currentTime = seconds;
        Chromecast_1.default.controller.seek();
    };
    MediaControllerInstance.prototype.seekToPercentage = function (ratio) {
        var duration = Chromecast_1.default.player.duration;
        if (ratio > 1)
            throw new Error('Controller::seekToPercentage - Ratio value must be a floating point number between 0 and 1');
        Chromecast_1.default.player.currentTime = duration * ratio;
        Chromecast_1.default.controller.seek();
    };
    MediaControllerInstance.prototype.stop = function (drainQueue) {
        if (drainQueue) {
            Chromecast_1.default.queue.drain();
        }
        Chromecast_1.default.controller.stop();
    };
    MediaControllerInstance.prototype.adjustVolume = function (volume) {
        if (volume > 1)
            throw new Error('Controller::adjustVolume - Volume value must be a floating point number between 0 and 1');
        Chromecast_1.default.player.volumeLevel = volume;
        Chromecast_1.default.controller.setVolumeLevel();
    };
    MediaControllerInstance.prototype.rewind = function () {
        this.seekToTime(0);
    };
    return MediaControllerInstance;
}());
var Controller = new MediaControllerInstance();
exports.default = Controller;
