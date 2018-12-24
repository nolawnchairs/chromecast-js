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
