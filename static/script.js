(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var cc = require('./lib/Chromecast')
var re = require('./lib/Registrar')
var co = require('./lib/Controller')

module.exports =  {
  Chromecast: cc.default,
  CastOptions: cc.CastOptions,
  Register: re.default,
  Controller: co.default
}


},{"./lib/Chromecast":3,"./lib/Controller":4,"./lib/Registrar":8}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Bind(target, propertyKey, descriptor) {
    if (!descriptor || (typeof descriptor.value !== 'function')) {
        throw new TypeError("Only methods can be decorated with @bind. <" + propertyKey + "> is not a method!");
    }
    return {
        configurable: true,
        get: function () {
            var bound = descriptor.value.bind(this);
            Object.defineProperty(this, propertyKey, {
                value: bound,
                configurable: true,
                writable: true
            });
            return bound;
        }
    };
}
exports.default = Bind;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Bind_1 = tslib_1.__importDefault(require("./Bind"));
var PlayerEvent_1 = require("./PlayerEvent");
var Media_1 = tslib_1.__importDefault(require("./Media"));
var Queue_1 = tslib_1.__importDefault(require("./Queue"));
var Controller_1 = tslib_1.__importDefault(require("./Controller"));
var onAvailableCallbackId = '__onGCastApiAvailable';
var AutoJoinPolicy;
(function (AutoJoinPolicy) {
    AutoJoinPolicy["CUSTOM_CONTROLLER_SCOPED"] = "custom_controller_scoped";
    AutoJoinPolicy["TAB_AND_ORIGIN_SCOPED"] = "tab_and_origin_scoped";
    AutoJoinPolicy["ORIGIN_SCOPED"] = "origin_scoped";
    AutoJoinPolicy["PAGE_SCOPED"] = "page_scoped";
})(AutoJoinPolicy = exports.AutoJoinPolicy || (exports.AutoJoinPolicy = {}));
var CastOptions = (function () {
    function CastOptions() {
        this._options = {
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
            receiverApplicationId: 'CC1AD845',
            language: 'en'
        };
    }
    CastOptions.prototype.setOptions = function (options) {
        this._options = tslib_1.__assign({}, this._options, options);
    };
    Object.defineProperty(CastOptions.prototype, "options", {
        get: function () {
            return this._options;
        },
        enumerable: true,
        configurable: true
    });
    return CastOptions;
}());
exports.CastOptions = CastOptions;
var ChromecastInstance = (function () {
    function ChromecastInstance() {
        this._ready = false;
        this._currentQueuetem = -1;
        this._readyStateListener = function () { };
        this._shutdownStateListener = function () { };
        this._errorListener = function () { };
        this.AutoJoinPolicy = {
            CUSTOM_CONTROLLER_SCOPED: 'custom_controller_scoped',
            TAB_AND_ORIGIN_SCOPED: 'tab_and_origin_scoped',
            ORIGIN_SCOPED: 'origin_scoped',
            PAGE_SCOPED: 'page_scoped'
        };
        this._eventDelegate = new PlayerEvent_1.PlayerEventDelegate();
        this._queue = new Queue_1.default();
    }
    ChromecastInstance.prototype.isReady = function () {
        return this._ready;
    };
    ChromecastInstance.prototype.initializeCastService = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (typeof chrome.cast === 'undefined') {
                var t = document.createElement('script');
                t.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
                document.body.appendChild(t);
                window[onAvailableCallbackId] = function (available) {
                    if (available) {
                        _this._context = cast.framework.CastContext.getInstance();
                        _this._context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, _this.onSessionStateChange);
                        _this._options = new CastOptions();
                        if (options)
                            _this._options.setOptions(options);
                        _this._context.setOptions(_this._options.options);
                        resolve();
                    }
                    else {
                        reject(new Error('Cast service is not available'));
                    }
                };
            }
        });
    };
    ChromecastInstance.prototype.setReadyStateListner = function (listener) {
        this._readyStateListener = listener;
    };
    ChromecastInstance.prototype.setShutownStateListener = function (listener) {
        this._shutdownStateListener = listener;
    };
    ChromecastInstance.prototype.setErrorListener = function (listener) {
        this._errorListener = listener;
    };
    Object.defineProperty(ChromecastInstance.prototype, "eventDelegate", {
        get: function () {
            return this._eventDelegate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChromecastInstance.prototype, "controller", {
        get: function () {
            return this._controller;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChromecastInstance.prototype, "player", {
        get: function () {
            return this._player;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChromecastInstance.prototype, "session", {
        get: function () {
            return this._castSession;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChromecastInstance.prototype, "currentQueueItem", {
        get: function () {
            return this._currentQueuetem;
        },
        enumerable: true,
        configurable: true
    });
    ChromecastInstance.prototype.getCurrentMedia = function () {
        return this._castSession.getMediaSession().media;
    };
    ChromecastInstance.prototype.disconnect = function () {
        this._castSession.endSession(true);
        this.removeListeners();
        this._ready = false;
    };
    ChromecastInstance.prototype.on = function (event, fn) {
        this._eventDelegate.addListener(event, fn);
    };
    ChromecastInstance.prototype.off = function (event) {
        this._eventDelegate.removeListener(event);
    };
    ChromecastInstance.prototype.newMediaEntity = function (mediaId, mimeType, title, image, meta) {
        return Media_1.default.newEntity(mediaId, mimeType, title, image, meta);
    };
    ChromecastInstance.prototype.playOne = function (media) {
        var request = new chrome.cast.media.LoadRequest(media);
        this._castSession.loadMedia(request)
            .then(this.createController, this.onMediaLoadError)
            .catch(console.error);
    };
    ChromecastInstance.prototype.queueItems = function (items) {
        this._queue.add(items.map(function (i) { return new chrome.cast.media.QueueItem(i); }));
    };
    ChromecastInstance.prototype.appendToQueue = function (item) {
        var _this = this;
        if (!this._queue.started)
            throw new Error('Chromecast::appendToQueue - Queue items cannot be appended before queued media has begun playback. Add your media items using Chromecast::queueItems before starting playback');
        this._queue.append(new chrome.cast.media.QueueItem(item), this._castSession.getMediaSession())
            .then(function () { return _this.emitQueueEvent('queueInsert', _this._queue.items); })
            .catch(this.onError);
    };
    ChromecastInstance.prototype.removeFromQueue = function (item) {
        var _this = this;
        if (!this._queue.started)
            throw new Error('Chromecast::removeFromQueue - Queue items cannot be removed before queued media has begun playback.');
        this._queue.removeItem(item, this._castSession.getMediaSession())
            .then(function () { return _this.emitQueueEvent('queueRemove', _this._queue.items); })
            .catch(this.onError);
    };
    ChromecastInstance.prototype.reorderQueue = function () {
        if (arguments.length == 0)
            throw new Error('Chromecast::redorderQueue - no arguments');
        if (!this._queue.started)
            throw new Error('Chromecast::redorderQueue - Queue items cannot be reordered before queued media has begun playback.');
        var items = typeof arguments[0] == 'number' ? [arguments[0]] : arguments[0];
        this._queue.reorderItems(items, this._castSession.getMediaSession(), arguments[1] || null);
    };
    ChromecastInstance.prototype.startQueue = function () {
        var request = new chrome.cast.media.QueueLoadRequest(this._queue.items);
        this._castSessionData.queueLoad(request, this.onQueueLoaded, this.onError);
    };
    ChromecastInstance.prototype.restartCurrent = function () {
        Controller_1.default.seekToTime(0);
    };
    ChromecastInstance.prototype.playNext = function () {
        this._castSession.getMediaSession().queueNext(this.onQueuedItemChange, this.onError);
    };
    ChromecastInstance.prototype.playPrevious = function () {
        this._castSession.getMediaSession().queuePrev(this.onQueuedItemChange, this.onError);
    };
    ChromecastInstance.prototype.createController = function () {
        this.removeListeners();
        this._player = new cast.framework.RemotePlayer();
        this._controller = new cast.framework.RemotePlayerController(this._player);
        this._controller.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent);
    };
    ChromecastInstance.prototype.onSessionStateChange = function (event) {
        switch (event.sessionState) {
            case cast.framework.SessionState.SESSION_ENDED:
                this._shutdownStateListener();
                break;
            case cast.framework.SessionState.SESSION_STARTED:
                this._castSession = this._context.getCurrentSession();
                this._castSessionData = this._castSession.getSessionObj();
                this._readyStateListener();
                break;
        }
    };
    ChromecastInstance.prototype.awaitQueueChange = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2, new Promise(function (resolve) {
                        var i = window.setInterval(function () {
                            if (_this._castSession.getMediaSession() != null) {
                                window.clearInterval(i);
                                resolve();
                            }
                        }, 100);
                    })];
            });
        });
    };
    ChromecastInstance.prototype.onQueueLoaded = function () {
        this.createController();
        this._queue.start();
        this._currentQueuetem = 0;
        this.emitQueueEvent('queueStart');
        this.emitQueueEvent('queueItem', 0);
    };
    ChromecastInstance.prototype.onMediaLoadError = function (errorCode) {
        this._errorListener(new chrome.cast.Error(errorCode));
    };
    ChromecastInstance.prototype.onError = function (error) {
        this._errorListener(error);
    };
    ChromecastInstance.prototype.onQueuedItemChange = function () {
        var _this = this;
        this.awaitQueueChange().then(function () {
            _this._currentQueuetem = _this._castSession.getMediaSession().currentItemId - 1;
            _this.emitQueueEvent('queueItem', _this._currentQueuetem);
        });
    };
    ChromecastInstance.prototype.onPlayerEvent = function (event) {
        this._eventDelegate.invoke(event.field, event.value);
    };
    ChromecastInstance.prototype.emitQueueEvent = function (event, value) {
        this._eventDelegate.invoke(event, value);
    };
    ChromecastInstance.prototype.removeListeners = function () {
        if (!!this._controller)
            this._controller.removeEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent);
    };
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onSessionStateChange", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onQueueLoaded", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onMediaLoadError", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onError", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onQueuedItemChange", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onPlayerEvent", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "emitQueueEvent", null);
    return ChromecastInstance;
}());
var Chromecast = new ChromecastInstance();
exports.default = Chromecast;

},{"./Bind":2,"./Controller":4,"./Media":5,"./PlayerEvent":6,"./Queue":7,"tslib":9}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Chromecast_1 = tslib_1.__importDefault(require("./Chromecast"));
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
            throw new Error("Controller::seekToTime - Cannot seek beyond duration bounds; max value is " + duration);
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
    MediaControllerInstance.prototype.stop = function () {
        Chromecast_1.default.controller.stop();
    };
    MediaControllerInstance.prototype.adjustVolume = function (volume) {
        if (volume > 1)
            throw new Error('Controller::adjustVolume - Volume value must be a floating point number between 0 and 1');
        Chromecast_1.default.player.volumeLevel = volume;
        Chromecast_1.default.controller.setVolumeLevel();
    };
    return MediaControllerInstance;
}());
var Controller = new MediaControllerInstance();
exports.default = Controller;

},{"./Chromecast":3,"tslib":9}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MediaImpl = (function () {
    function MediaImpl() {
        this._imageProps = null;
    }
    MediaImpl.prototype.setDefaultImageProperties = function (w, h) {
        this._imageProps = { w: w, h: h };
    };
    MediaImpl.prototype.newEntity = function (mediaId, mimeType, title, image, meta) {
        var media = new chrome.cast.media.MediaInfo(mediaId, mimeType);
        var metadata = new chrome.cast.media.GenericMediaMetadata();
        metadata.title = title || null;
        if (!!image) {
            var i = new chrome.cast.Image(image);
            if (this._imageProps) {
                i.width = this._imageProps.w;
                i.height = this._imageProps.h;
            }
            metadata.images = [];
            metadata.images.push(i);
        }
        if (!!title) {
            metadata.title = title;
        }
        media.metadata = metadata;
        if (!!meta && (!image || !title)) {
            media.metadata = meta;
        }
        return media;
    };
    return MediaImpl;
}());
var Media = new MediaImpl();
exports.default = Media;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Bind_1 = tslib_1.__importDefault(require("./Bind"));
var Chromecast_1 = tslib_1.__importDefault(require("./Chromecast"));
var PlayerEventDelegate = (function () {
    function PlayerEventDelegate() {
        this._handlers = new Map();
        this._listeners = new Map();
        this._playbackListeners = new Map();
        this._castListeners = new Map();
        this._playerCapabilityListeners = new Map();
        this._queueListeners = new Map();
        this._nativeEventListeners = new Map();
        this._currentInfo = null;
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
        this.bind('queueItem', this.onQueueItemChanged);
    }
    PlayerEventDelegate.prototype.bind = function (id, handler) {
        this._handlers.set(id, handler);
    };
    PlayerEventDelegate.prototype.addListener = function (event, handler) {
        this._listeners.set(event, handler);
    };
    PlayerEventDelegate.prototype.removeListener = function (event) {
        this._listeners.delete(event);
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
        if (this._handlers.has(eventId)) {
            this._handlers.get(eventId)(value);
        }
        if (this._listeners.has(eventId)) {
            this._listeners.get(eventId)(value);
        }
    };
    PlayerEventDelegate.prototype.matchMedia = function (that) {
        if (!this._currentInfo || !that)
            return false;
        return this._currentInfo.contentId == that.contentId;
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
        }
    };
    PlayerEventDelegate.prototype.onDurationChanged = function (duration) {
        this._castListeners.forEach(function (l) { return l.onDurationChanged(duration); });
    };
    PlayerEventDelegate.prototype.onMediaInfoChanged = function (info) {
        this._castListeners.forEach(function (l) { return l.onMediaInfoChanged(info); });
        if (!this.matchMedia(info) && !!this._currentInfo) {
            this._playbackListeners.forEach(function (l) { return l.onEnded(); });
            this._queueListeners.forEach(function (l) { return l.onItemChanged(Chromecast_1.default.currentQueueItem); });
            this._currentInfo = info;
        }
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

},{"./Bind":2,"./Chromecast":3,"tslib":9}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Queue = (function () {
    function Queue() {
        this._started = false;
        this._items = [];
    }
    Object.defineProperty(Queue.prototype, "started", {
        get: function () {
            return this._started;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Queue.prototype, "items", {
        get: function () {
            return this._items;
        },
        enumerable: true,
        configurable: true
    });
    Queue.prototype.start = function () {
        this._started = true;
    };
    Queue.prototype.add = function (items, media) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            items.forEach(function (i) { return _this._items.push(i); });
            if (_this._started && !!media) {
                var req = new chrome.cast.media.QueueInsertItemsRequest(items);
                media.queueInsertItems(req, resolve, reject);
            }
            else {
                resolve();
            }
        });
    };
    Queue.prototype.append = function (item, media) {
        return this.add([item], media);
    };
    Queue.prototype.removeItem = function (itemId, media) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._items = _this._items.splice(itemId, 1);
            if (_this._started && !!media) {
                media.queueRemoveItem(itemId, resolve, reject);
            }
            else {
                resolve();
            }
        });
    };
    Queue.prototype.reorderItems = function (items, media, before) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var req = new chrome.cast.media.QueueReorderItemsRequest(items);
            var success = function () {
                _this._items = media.items;
                resolve();
            };
            if (!!before)
                req.insertBefore = before;
            media.queueReorderItems(req, success, reject);
        });
    };
    return Queue;
}());
exports.default = Queue;

},{}],8:[function(require,module,exports){
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

},{"./Chromecast":3,"tslib":9}],9:[function(require,module,exports){
(function (global){
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global global, define, System, Reflect, Promise */
var __extends;
var __assign;
var __rest;
var __decorate;
var __param;
var __metadata;
var __awaiter;
var __generator;
var __exportStar;
var __values;
var __read;
var __spread;
var __await;
var __asyncGenerator;
var __asyncDelegator;
var __asyncValues;
var __makeTemplateObject;
var __importStar;
var __importDefault;
(function (factory) {
    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
    if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function (exports) { factory(createExporter(root, createExporter(exports))); });
    }
    else if (typeof module === "object" && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
    }
    else {
        factory(createExporter(root));
    }
    function createExporter(exports, previous) {
        if (exports !== root) {
            if (typeof Object.create === "function") {
                Object.defineProperty(exports, "__esModule", { value: true });
            }
            else {
                exports.__esModule = true;
            }
        }
        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
    }
})
(function (exporter) {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

    __extends = function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    __rest = function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
                t[p[i]] = s[p[i]];
        return t;
    };

    __decorate = function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };

    __param = function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };

    __metadata = function (metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    };

    __awaiter = function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    __generator = function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };

    __exportStar = function (m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    };

    __values = function (o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    };

    __read = function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };

    __spread = function () {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    };

    __await = function (v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    };

    __asyncGenerator = function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };

    __asyncDelegator = function (o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    };

    __asyncValues = function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    };

    __makeTemplateObject = function (cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    __importStar = function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result["default"] = mod;
        return result;
    };

    __importDefault = function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    exporter("__extends", __extends);
    exporter("__assign", __assign);
    exporter("__rest", __rest);
    exporter("__decorate", __decorate);
    exporter("__param", __param);
    exporter("__metadata", __metadata);
    exporter("__awaiter", __awaiter);
    exporter("__generator", __generator);
    exporter("__exportStar", __exportStar);
    exporter("__values", __values);
    exporter("__read", __read);
    exporter("__spread", __spread);
    exporter("__await", __await);
    exporter("__asyncGenerator", __asyncGenerator);
    exporter("__asyncDelegator", __asyncDelegator);
    exporter("__asyncValues", __asyncValues);
    exporter("__makeTemplateObject", __makeTemplateObject);
    exporter("__importStar", __importStar);
    exporter("__importDefault", __importDefault);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],10:[function(require,module,exports){
const movies = require('./movies.json')
const { Chromecast, Register, Controller } = require('..')

const options = {
  receiverApplicationId: '87F34079',
  autoJoinPolicy: Chromecast.AutoJoinPolicy.ORIGIN_SCOPED
}

const hooks = []

registerClick('pp', () => Controller.togglePlay())
registerClick('stop', () => disconnect())
registerClick('seek', () => Controller.seekToPercentage(.98))
registerClick('add', () => {
  Chromecast.appendToQueue(createEntity(movies[2]))
})
registerClick('skip', () => Chromecast.playNext())

Chromecast.initializeCastService(options).catch(console.error)
Chromecast.setReadyStateListner(() => onReady())

function createEntity(movie) {
  return Chromecast.newMediaEntity(movie.url, 'video/mp4', movie.title, movie.image)
}

function registerClick(id, fn) {
  document.getElementById(id).addEventListener('click', fn)
}

function disconnect() {
  Controller.stop()
  Chromecast.disconnect()
  hooks.forEach(h => h())
}

function onReady() {

  const videos = [
    createEntity(movies[0]),
    createEntity(movies[1])
  ]

  Chromecast.queueItems(videos)
  Chromecast.startQueue()

  Chromecast.on('queueItem', i => console.log('queueItem: '+ i))

  hooks.push(Register.forEvents({
    onEvent(event, value) {
      console.log(event, value)
    }
  }))
  
  hooks.push(Register.forPlayerEvents({
    onTimeUpdate(time) {},
    onPaused() {},
    onPlaying() {},
    onBuffering() {},
    onIdle() {},
    onStop() {},
    onMuteChange(muted) {},
    onVolumeChanged(volume) {},
    onEnded() {
      
    },
  }))
  
}




},{"..":1,"./movies.json":11}],11:[function(require,module,exports){
module.exports=[
  {
    "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "title": "Big Buck Bunny",
    "image": "https://payloads.enaturelive.com/posters/0EE08B6A217E0ADC/T-3B709EC02A1BEE9A.JPG"
  },
  {
    "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "title": "Elephant's Dream",
    "image": "https://payloads.enaturelive.com/posters/EA7A70A934B8539B/T-2B5081B5E19F2471.jpg"
  },
  {
    "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "title": "For Bigger Blazes",
    "image": "https://payloads.enaturelive.com/posters/2D19CDAC641B3437/T-8403CE489DB831A4.jpg"
  }
]
},{}]},{},[10]);
