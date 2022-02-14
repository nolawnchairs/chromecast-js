"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerEventDelegate = void 0;
var tslib_1 = require("tslib");
var Bind_1 = (0, tslib_1.__importDefault)(require("./Bind"));
var PlayerEventDelegate = (function () {
    function PlayerEventDelegate(queue) {
        this._listeners = new Map();
        this._allHandlers = null;
        this._queueListeners = new Map();
        this._queue = queue;
        this.bind('isMediaLoaded', this.isMediaLoaded);
        this.bind('playerState', this.onPlayerState);
        this.bind('queueStart', this.onQueueStart);
        this.bind('queueComplete', this.onQueueStopped);
        this.bind('queueInsert', this.onQueueUpdated);
        this.bind('queueRemove', this.onQueueUpdated);
        this.bind('queueUpdate', this.onQueueUpdated);
        this.bind('queueItem', this.onQueueItemChanged);
    }
    PlayerEventDelegate.prototype.bind = function (id, handler) {
        this._listeners.set(id, handler);
    };
    PlayerEventDelegate.prototype.removeAll = function () {
        this._listeners.clear();
        this._queueListeners.clear();
        this._allHandlers = null;
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
    PlayerEventDelegate.prototype.setAnyEventListener = function (listener) {
        this._allHandlers = listener;
    };
    PlayerEventDelegate.prototype.invoke = function (eventId, value) {
        if (this._allHandlers) {
            this._allHandlers(eventId, value);
        }
        if (this._listeners.has(eventId)) {
            this._listeners.get(eventId)(value);
        }
    };
    PlayerEventDelegate.prototype.onPlayerState = function (state) {
        if (state == null) {
            this._queueListeners.forEach(function (l) { return l.onStopped(); });
        }
    };
    PlayerEventDelegate.prototype.isMediaLoaded = function (is) {
        if (!is && !this._queue.isNextItemUserSelected()) {
            this._mediaCompleteListener();
        }
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
    (0, tslib_1.__decorate)([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onPlayerState", null);
    (0, tslib_1.__decorate)([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "isMediaLoaded", null);
    (0, tslib_1.__decorate)([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onQueueStart", null);
    (0, tslib_1.__decorate)([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onQueueStopped", null);
    (0, tslib_1.__decorate)([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onQueueUpdated", null);
    (0, tslib_1.__decorate)([
        Bind_1.default
    ], PlayerEventDelegate.prototype, "onQueueItemChanged", null);
    return PlayerEventDelegate;
}());
exports.PlayerEventDelegate = PlayerEventDelegate;
