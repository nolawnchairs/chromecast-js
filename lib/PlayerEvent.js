"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Bind_1 = tslib_1.__importDefault(require("./Bind"));
var PlayerEventDelegate = (function () {
    function PlayerEventDelegate(queue) {
        this._listeners = new Map();
        this._allHandlers = new Map();
        this._playbackListeners = new Map();
        this._castListeners = new Map();
        this._playerCapabilityListeners = new Map();
        this._queueListeners = new Map();
        this._nativeEventListeners = new Map();
        this._queue = queue;
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
        this.bind('queueStart', this.onQueueStart);
        this.bind('queueComplete', this.onQueueStopped);
        this.bind('queueInsert', this.onQueueUpdated);
        this.bind('queueRemove', this.onQueueUpdated);
        this.bind('queueUpdate', this.onQueueUpdated);
        this.bind('queueItem', this.onQueueItemChanged);
    }
    PlayerEventDelegate.prototype.bind = function (id, handler) {
        this._allHandlers.set(id, handler);
    };
    PlayerEventDelegate.prototype.removeAll = function () {
        this._listeners.clear();
        this._playbackListeners.clear();
        this._castListeners.clear();
        this._playerCapabilityListeners.clear();
        this._queueListeners.clear();
        this._nativeEventListeners.clear();
        this._allHandlers.clear();
    };
    PlayerEventDelegate.prototype.addListener = function (event, handler) {
        this._listeners.set(event, handler);
    };
    PlayerEventDelegate.prototype.removeListener = function (event) {
        this._listeners.delete(event);
    };
    PlayerEventDelegate.prototype.setMediaCompleteListener = function (listener) {
        this._mediaCompleteListener = listener;
    };
    PlayerEventDelegate.prototype.registerPlaybackEventListener = function (listener) {
        var _this = this;
        var random = Math.random();
        this._playbackListeners.set(random, listener);
        return function () { return _this._playbackListeners.delete(random); };
    };
    PlayerEventDelegate.prototype.registerCastEventListener = function (listener) {
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
    PlayerEventDelegate.prototype.registerQueueEventListener = function (listener) {
        var _this = this;
        var random = Math.random();
        this._queueListeners.set(random, listener);
        return function () { return _this._queueListeners.delete(random); };
    };
    PlayerEventDelegate.prototype.registerNativeEventListener = function (listener) {
        var _this = this;
        var random = Math.random();
        this._nativeEventListeners.set(random, listener);
        return function () { return _this._nativeEventListeners.delete(random); };
    };
    PlayerEventDelegate.prototype.invoke = function (eventId, value) {
        this._nativeEventListeners.forEach(function (l) { return l.onEvent(eventId, value); });
        if (this._allHandlers.has(eventId)) {
            this._allHandlers.get(eventId)(value);
        }
        if (this._listeners.has(eventId)) {
            this._listeners.get(eventId)(value);
        }
    };
    PlayerEventDelegate.prototype.isConnected = function (is) {
        console.log('is connected', is);
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
        if (state == null) {
            this._queueListeners.forEach(function (l) { return l.onStopped(); });
            return;
        }
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
            if (!this._queue.isNextItemUserSelected())
                this._mediaCompleteListener();
        }
    };
    PlayerEventDelegate.prototype.onDurationChanged = function (duration) {
        this._castListeners.forEach(function (l) { return l.onDurationChanged(duration); });
    };
    PlayerEventDelegate.prototype.onMediaInfoChanged = function (info) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                if (!!info) {
                    this._castListeners.forEach(function (l) { return l.onMediaInfoChanged(info); });
                    if (info.contentId != this._queue.current.contentId) {
                        this._playbackListeners.forEach(function (l) { return l.onEnded(); });
                    }
                }
                return [2];
            });
        });
    };
    PlayerEventDelegate.prototype.onMuteChange = function (is) {
        this._playbackListeners.forEach(function (l) { return l.onMuteChange(is); });
    };
    PlayerEventDelegate.prototype.onVolumeLevel = function (volume) {
        this._playbackListeners.forEach(function (l) { return l.onVolumeChange(volume); });
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
    PlayerEventDelegate.prototype.onQueueStart = function () {
        this._queueListeners.forEach(function (l) { return l.onStarted(); });
    };
    PlayerEventDelegate.prototype.onQueueStopped = function () {
        this._queueListeners.forEach(function (l) { return l.onStopped(); });
    };
    PlayerEventDelegate.prototype.onQueueUpdated = function () {
        this._queueListeners.forEach(function (l) { return l.onUpdated(); });
    };
    PlayerEventDelegate.prototype.onQueueItemChanged = function (item) {
        this._queueListeners.forEach(function (l) { return l.onItemChanged(item); });
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
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onQueueStart", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onQueueStopped", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onQueueUpdated", null);
    tslib_1.__decorate([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onQueueItemChanged", null);
    return PlayerEventDelegate;
}());
exports.PlayerEventDelegate = PlayerEventDelegate;
