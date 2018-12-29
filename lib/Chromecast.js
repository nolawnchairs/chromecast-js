"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Bind_1 = tslib_1.__importDefault(require("./Bind"));
var PlayerEvent_1 = require("./PlayerEvent");
var Media_1 = tslib_1.__importDefault(require("./Media"));
var MediaQueue_1 = tslib_1.__importDefault(require("./MediaQueue"));
var Options_1 = require("./Options");
var onAvailableCallbackId = '__onGCastApiAvailable';
var ChromecastInstance = (function () {
    function ChromecastInstance() {
        this._ready = false;
        this._readyStateListener = function () { };
        this._shutdownStateListener = function () { };
        this._errorListener = function () { };
        this.AutoJoinPolicy = {
            CUSTOM_CONTROLLER_SCOPED: 'custom_controller_scoped',
            TAB_AND_ORIGIN_SCOPED: 'tab_and_origin_scoped',
            ORIGIN_SCOPED: 'origin_scoped',
            PAGE_SCOPED: 'page_scoped'
        };
        this._queue = new MediaQueue_1.default();
        this._eventDelegate = new PlayerEvent_1.PlayerEventDelegate(this._queue);
        this._eventDelegate.setMediaCompleteListener(this.onMediaOrganicallyCompleted);
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
                        _this._options = new Options_1.CastOptions();
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
    Object.defineProperty(ChromecastInstance.prototype, "queue", {
        get: function () {
            return this._queue;
        },
        enumerable: true,
        configurable: true
    });
    ChromecastInstance.prototype.setReadyStateListner = function (listener) {
        this._readyStateListener = listener;
    };
    ChromecastInstance.prototype.setShutownStateListener = function (listener) {
        this._shutdownStateListener = listener;
    };
    ChromecastInstance.prototype.setErrorListener = function (listener) {
        this._errorListener = listener;
    };
    ChromecastInstance.prototype.disconnect = function () {
        this._castSession.endSession(true);
        this._queue.clear();
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
    ChromecastInstance.prototype.enqueue = function (item) {
        this.enqueueItems([item]);
    };
    ChromecastInstance.prototype.enqueueItems = function (items) {
        this._queue.add(items);
    };
    ChromecastInstance.prototype.appendToQueue = function (item) {
        if (!this._queue.started)
            throw new Error('Chromecast::appendToQueue - Items cannot be appended before queued media has begun playback. Add your media items using Chromecast::queueItems before starting playback');
        this._queue.append(item);
        this.emitQueueEvent('queueInsert', this._queue.items);
    };
    ChromecastInstance.prototype.removeFromQueue = function (item) {
        if (!this._queue.started)
            throw new Error('Chromecast::removeFromQueue - Items cannot be removed before queued media has begun playback.');
        if (item >= this._queue.length)
            throw new Error("Chromecast::removeFromQueue - Index out of bounds, attempt to reference index " + item + " of " + this._queue.length + " items");
        if (this._queue.removeItem(item)) {
            this._controller.stop();
            this.loadItem(this._queue.current);
        }
        this.emitQueueEvent('queueRemove', this._queue.items);
    };
    ChromecastInstance.prototype.reorderQueue = function (from, to) {
        if (!this._queue.started)
            throw new Error('Chromecast::redorderQueue - Items cannot be reordered before queued media has begun playback.');
        if (from >= this._queue.length - 1)
            throw new Error("Chromecast::reorderQueue - Index out of bounds, attempt to reference index " + from + " of " + this._queue.length + " items");
        this._queue.reorderItem(from, to);
        this.emitQueueEvent('queueUpdate', this._queue.items);
    };
    ChromecastInstance.prototype.startQueue = function (startingTime) {
        var _this = this;
        if (startingTime === void 0) { startingTime = 0; }
        if (this._queue.length == 0)
            throw new Error('Chromecast::startQueue - No items in queue');
        var item = this._queue.next();
        if (item) {
            this.loadItem(item, false, startingTime)
                .then(function () {
                _this._queue.start();
                _this.emitQueueEvent('queueItem', 0);
            })
                .catch(this.onMediaLoadError);
        }
    };
    ChromecastInstance.prototype.advance = function (isUserAction) {
        if (isUserAction === void 0) { isUserAction = false; }
        var item = this._queue.next(isUserAction);
        if (item) {
            this.loadItem(item, isUserAction).catch(this.onMediaLoadError);
            this.emitQueueEvent('queueItem', this._queue.currentItem);
        }
    };
    ChromecastInstance.prototype.playNext = function () {
        this.advance(true);
    };
    ChromecastInstance.prototype.playPrevious = function () {
        this._controller.stop();
        var item = this._queue.previous();
        if (item) {
            this.loadItem(item, true);
        }
    };
    ChromecastInstance.prototype.createController = function () {
        this.removeListeners();
        this._controller = new cast.framework.RemotePlayerController(this._player);
        this._controller.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent);
    };
    ChromecastInstance.prototype.loadItem = function (item, fromUser, startTime) {
        if (fromUser === void 0) { fromUser = false; }
        if (startTime === void 0) { startTime = 0; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var request, loadError, timeout;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = new chrome.cast.media.LoadRequest(item);
                        request.currentTime = startTime;
                        return [4, this._castSession.loadMedia(request)];
                    case 1:
                        loadError = _a.sent();
                        this.createController();
                        this._queue.setNextItemUserSelected(fromUser);
                        timeout = window.setTimeout(function () {
                            _this._queue.setNextItemUserSelected(false);
                            window.clearTimeout(timeout);
                        }, 1000);
                        return [2, loadError ? Promise.reject(loadError) : Promise.resolve()];
                }
            });
        });
    };
    ChromecastInstance.prototype.onSessionStateChange = function (event) {
        switch (event.sessionState) {
            case cast.framework.SessionState.SESSION_ENDED:
                this._shutdownStateListener();
                break;
            case cast.framework.SessionState.SESSION_STARTED:
            case cast.framework.SessionState.SESSION_RESUMED:
                this._castSession = this._context.getCurrentSession();
                this._player = new cast.framework.RemotePlayer();
                this._readyStateListener();
                break;
        }
    };
    ChromecastInstance.prototype.onMediaOrganicallyCompleted = function () {
        this.playNext();
    };
    ChromecastInstance.prototype.onMediaLoadError = function (errorCode) {
        this._errorListener(new chrome.cast.Error(errorCode));
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
    ], ChromecastInstance.prototype, "onMediaOrganicallyCompleted", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onMediaLoadError", null);
    tslib_1.__decorate([
        Bind_1.default
    ], ChromecastInstance.prototype, "onPlayerEvent", null);
    return ChromecastInstance;
}());
var Chromecast = new ChromecastInstance();
exports.default = Chromecast;
