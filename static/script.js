(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

var cc = require('./lib/Chromecast')
var re = require('./lib/Registrar')
var co = require('./lib/Controller')

module.exports =  {
  Chromecast: cc.default,
  CastOptions: cc.CastOptions,
  Register: re.default,
  Controller: co.default
}

},{"./lib/Chromecast":3,"./lib/Controller":4,"./lib/Registrar":7}],2:[function(require,module,exports){
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
var onAvailableCallbackId = '__onGCastApiAvailable';
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
        this._mediaQueue = [];
        this._readyStateListener = function () { };
        this._errorListener = function () { };
        this._eventHandler = new PlayerEvent_1.PlayerEventDelegate();
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
    ChromecastInstance.prototype.setErrorListener = function (listener) {
        this._errorListener = listener;
    };
    Object.defineProperty(ChromecastInstance.prototype, "eventDelegate", {
        get: function () {
            return this._eventHandler;
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
    ChromecastInstance.prototype.disconnect = function () {
        this._session.endSession(true);
        this.removeListeners();
        this._ready = false;
    };
    ChromecastInstance.prototype.newMediaEntity = function (mediaId, mimeType, title, image, meta) {
        return Media_1.default.newEntity(mediaId, mimeType, title, image, meta);
    };
    ChromecastInstance.prototype.playOne = function (media) {
        var request = new chrome.cast.media.LoadRequest(media);
        this._session.loadMedia(request)
            .then(this.onMediaLoaded, this.onMediaLoadError)
            .catch(console.error);
    };
    ChromecastInstance.prototype.queue = function (items) {
        var _this = this;
        items.forEach(function (i) { return _this._mediaQueue.push(new chrome.cast.media.QueueItem(i)); });
    };
    ChromecastInstance.prototype.addToQueue = function (item) {
        this._mediaQueue.push(new chrome.cast.media.QueueItem(item));
    };
    ChromecastInstance.prototype.startQueue = function () {
        var request = new chrome.cast.media.QueueLoadRequest(this._mediaQueue);
        this._mediaSession.queueLoad(request, this.onMediaLoaded, this.onError);
    };
    ChromecastInstance.prototype.onSessionStateChange = function (event) {
        switch (event.sessionState) {
            case cast.framework.SessionState.SESSION_ENDED:
                break;
            case cast.framework.SessionState.SESSION_STARTED:
                this._session = this._context.getCurrentSession();
                this._mediaSession = this._session.getSessionObj();
                this._readyStateListener();
                break;
        }
    };
    ChromecastInstance.prototype.onMediaLoaded = function () {
        this.removeListeners();
        this._player = new cast.framework.RemotePlayer();
        this._controller = new cast.framework.RemotePlayerController(this._player);
        this._controller.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent);
    };
    ChromecastInstance.prototype.onMediaLoadError = function (errorCode) {
        this._errorListener(new chrome.cast.Error(errorCode));
    };
    ChromecastInstance.prototype.onError = function (error) {
        this._errorListener(error);
    };
    ChromecastInstance.prototype.onPlayerEvent = function (event) {
        this._eventHandler.invoke(event.field, event.value);
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
    ], ChromecastInstance.prototype, "onMediaLoaded", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onMediaLoadError", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onError", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onPlayerEvent", null);
    return ChromecastInstance;
}());
var Chromecast = new ChromecastInstance();
exports.default = Chromecast;

},{"./Bind":2,"./Media":5,"./PlayerEvent":6,"tslib":8}],4:[function(require,module,exports){
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

},{"./Chromecast":3,"tslib":8}],5:[function(require,module,exports){
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

},{"./Bind":2,"tslib":8}],7:[function(require,module,exports){
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
    Register.forNativeEvent = function (listener) {
        return Chromecast_1.default.eventDelegate.registerNativeEventListener(listener);
    };
    return Register;
}());
exports.default = Register;

},{"./Chromecast":3,"tslib":8}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){

const { Chromecast, Register, Controller } = require('..')

const toggle = document.getElementById('pp')
toggle.addEventListener('click', () => Controller.togglePlay())

const stop = document.getElementById('stop')
stop.addEventListener('click', () => {
  Controller.stop()
  Chromecast.disconnect()
})

const seek = document.getElementById('seek')
seek.addEventListener('click', () => Controller.seekToPercentage(.98))

const options = {
  receiverApplicationId: '87F34079',
  autoJoinPolicy: 'origin_scoped'
}

const videoQueue = []

Chromecast.initializeCastService(options)
  .catch(console.error)
Chromecast.setReadyStateListner(() => onReady())

function createEntity(url, title, image) {
  const item = Chromecast.newMediaEntity(url, 'video/mp4', title, image)
  videoQueue.push(item)
}

function onReady() {
  createEntity('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Big Buck Bunny', 'https://payloads.enaturelive.com/posters/0EE08B6A217E0ADC/T-3B709EC02A1BEE9A.JPG')
  createEntity('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', "Elephant's Dream", 'https://payloads.enaturelive.com/posters/EA7A70A934B8539B/T-2B5081B5E19F2471.jpg')
  Chromecast.queue(videoQueue)
  Chromecast.startQueue()

  Register.forNativeEvent({
    onEvent(event, value) {
      console.log(event, value)
    }
  })
  
  Register.forPlayerEvent({
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
  })
  
}




},{"..":1}]},{},[9]);
