"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Bind_1 = tslib_1.__importDefault(require("./Bind"));
var PlayerEventDelegate = (function () {
    function PlayerEventDelegate() {
        this._handlers = new Map();
        this._playbackListeners = new Map();
        this._castListeners = new Map();
        this._playerCapabilityListeners = new Map();
        this._nativeEventListeners = new Map();
        this.bind('isConnected', this.isConnected);
        this.bind('isMediaLoaded', this.isMediaLoaded);
        this.bind('duration', this.onDurationChanged);
        this.bind('currentTime', this.onTimeChange);
        this.bind('isPaused', this.onPaused);
        this.bind('volumeLevel', this.onVolumeLevel);
        this.bind('canControlVolume', this.canControlVolume);
        this.bind('isMuted', this.onMuteChange);
        this.bind('canPause', this.canPause);
        this.bind('canSeek', this.canSeek);
        this.bind('displayName', this.onDisplayNameChanged);
        this.bind('statusText', this.onStatusTextChange);
        this.bind('title', this.onTitleChange);
        this.bind('displayStatus', this.onDisplayStatusChange);
        this.bind('imageUrl', this.onImageUrlChange);
        this.bind('mediaInfo', this.onMediaInfoChanged);
        this.bind('playerState', this.onPlayerState);
    }
    PlayerEventDelegate.prototype.bind = function (id, handler) {
        this._handlers.set(id, handler);
    };
    PlayerEventDelegate.prototype.registerPlaybackEventListener = function (listener) {
        var _this = this;
        var random = Math.random();
        this._playbackListeners.set(random, listener);
        return function () { return _this._playbackListeners.delete(random); };
    };
    PlayerEventDelegate.prototype.registerConnectionEventListener = function (listener) {
        var _this = this;
        var random = Math.random();
        this._castListeners.set(random, listener);
        return function () { return _this._castListeners.delete(random); };
    };
    PlayerEventDelegate.prototype.registerPlayerCapabilityListener = function (listener) {
        var _this = this;
        var random = Math.random();
        this._playerCapabilityListeners.set(random, listener);
        return function () { return _this._playerCapabilityListeners.delete(random); };
    };
    PlayerEventDelegate.prototype.registerNativeEventListener = function (listener) {
        var _this = this;
        var random = Math.random();
        this._nativeEventListeners.set(random, listener);
        return function () { return _this._nativeEventListeners.delete(random); };
    };
    PlayerEventDelegate.prototype.invoke = function (eventId, value) {
        this._nativeEventListeners.forEach(function (l) { return l.onEvent(eventId, value); });
        if (this._handlers.has(eventId)) {
            this._handlers.get(eventId)(value);
        }
    };
    PlayerEventDelegate.prototype.isConnected = function (is) {
        if (is) {
            this._castListeners.forEach(function (l) { return l.onConnected(); });
        }
        else {
            this._castListeners.forEach(function (l) { return l.onDisconnected(); });
        }
    };
    PlayerEventDelegate.prototype.onTimeChange = function (time) {
        this._playbackListeners.forEach(function (l) { return l.onTimeUpdate(time); });
    };
    PlayerEventDelegate.prototype.onPlayerState = function (state) {
        switch (state) {
            case 'IDLE':
                this._playbackListeners.forEach(function (l) { return l.onIdle(); });
                break;
            case 'PLAYING':
                this._playbackListeners.forEach(function (l) { return l.onPlaying(); });
                break;
            case 'PAUSED':
                this._playbackListeners.forEach(function (l) { return l.onPaused(); });
                break;
            case 'BUFFERING':
                this._playbackListeners.forEach(function (l) { return l.onBuffering(); });
                break;
        }
    };
    PlayerEventDelegate.prototype.isMediaLoaded = function (is) {
        if (is) {
            this._castListeners.forEach(function (l) { return l.onMediaLoaded(); });
        }
        else {
            this._castListeners.forEach(function (l) { return l.onMediaUnloaded(); });
            this._playbackListeners.forEach(function (l) { return l.onEnded(); });
        }
    };
    PlayerEventDelegate.prototype.onDurationChanged = function (duration) {
        this._castListeners.forEach(function (l) { return l.onDurationChanged(duration); });
    };
    PlayerEventDelegate.prototype.onMediaInfoChanged = function (info) {
        this._castListeners.forEach(function (l) { return l.onMediaInfoChanged(info); });
    };
    PlayerEventDelegate.prototype.onMuteChange = function (is) {
        this._playbackListeners.forEach(function (l) { return l.onMuteChange(is); });
    };
    PlayerEventDelegate.prototype.onVolumeLevel = function (volume) {
        this._playbackListeners.forEach(function (l) { return l.onVolumeChanged(volume); });
    };
    PlayerEventDelegate.prototype.onPaused = function (paused) {
        if (paused) {
            this._playbackListeners.forEach(function (l) { return l.onPaused(); });
        }
    };
    PlayerEventDelegate.prototype.onDisplayNameChanged = function (name) {
        this._castListeners.forEach(function (l) { return l.onDisplayNameChanged(name); });
    };
    PlayerEventDelegate.prototype.onStatusTextChange = function (text) {
        this._castListeners.forEach(function (l) { return l.onStatusTextChanged(text); });
    };
    PlayerEventDelegate.prototype.onTitleChange = function (title) {
        this._castListeners.forEach(function (l) { return l.onTitleChanged(title); });
    };
    PlayerEventDelegate.prototype.onDisplayStatusChange = function (status) {
        this._castListeners.forEach(function (l) { return l.onDisplayStatusChanged(status); });
    };
    PlayerEventDelegate.prototype.onImageUrlChange = function (url) {
        this._castListeners.forEach(function (l) { return l.onImageUrlChanged(url); });
    };
    PlayerEventDelegate.prototype.canControlVolume = function (can) {
        this._playerCapabilityListeners.forEach(function (l) { return l.canChangeVolume(can); });
    };
    PlayerEventDelegate.prototype.canPause = function (can) {
        this._playerCapabilityListeners.forEach(function (l) { return l.canPause(can); });
    };
    PlayerEventDelegate.prototype.canSeek = function (can) {
        this._playerCapabilityListeners.forEach(function (l) { return l.canSeek(can); });
    };
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "isConnected", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onTimeChange", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onPlayerState", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "isMediaLoaded", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onDurationChanged", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onMediaInfoChanged", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onMuteChange", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onVolumeLevel", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onPaused", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onDisplayNameChanged", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onStatusTextChange", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onTitleChange", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onDisplayStatusChange", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onImageUrlChange", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "canControlVolume", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "canPause", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "canSeek", null);
    return PlayerEventDelegate;
}());
exports.PlayerEventDelegate = PlayerEventDelegate;
