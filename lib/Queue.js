"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Queue = (function () {
    function Queue() {
        this._started = false;
        this._items = [];
        this._queuedItemMapping = [];
        this._currentItemId = 0;
        this._currentQueueIndex = 0;
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
    Object.defineProperty(Queue.prototype, "currentItemId", {
        get: function () {
            return this._currentItemId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Queue.prototype, "currentQueueIndex", {
        get: function () {
            return this._currentQueueIndex;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Queue.prototype, "length", {
        get: function () {
            return this._queuedItemMapping.length;
        },
        enumerable: true,
        configurable: true
    });
    Queue.prototype.start = function (mediaSession) {
        this._started = true;
        this._currentItemId = mediaSession.currentItemId;
    };
    Queue.prototype.add = function (items) {
        var _this = this;
        items.forEach(function (item, i) {
            _this._items.push(item);
            _this._queuedItemMapping.push(i + 1);
        });
    };
    Queue.prototype.append = function (item, media) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var success = function () {
                _this._items.push(item);
                _this._queuedItemMapping.push(Math.max.apply(Math, _this._queuedItemMapping) + 1);
                _this.debug(media);
                resolve();
            };
            var req = new chrome.cast.media.QueueInsertItemsRequest([item]);
            media.queueInsertItems(req, success, reject);
        });
    };
    Queue.prototype.removeItem = function (queueId, media) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var success = function () {
                console.log('succeded in removing item %d', queueId);
                _this._items.splice(queueId, 1);
                _this._queuedItemMapping.splice(queueId, 1);
                console.log('current id is %d', _this._currentItemId);
                console.log(_this._queuedItemMapping, _this._items.map(function (i) { return i.media.contentId; }));
                resolve();
            };
            var itemId = _this._queuedItemMapping[queueId];
            media.queueRemoveItem(itemId, success, reject);
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
    Queue.prototype.setCurrentItemId = function (id) {
        this._currentItemId = id;
        this._currentQueueIndex = this.findQueueIndex(id);
    };
    Queue.prototype.findQueueIndex = function (mediaItemId) {
        var t = this._queuedItemMapping.indexOf(mediaItemId);
        if (t > -1)
            return this._items.findIndex(function ($, i) { return i == t; });
    };
    Queue.prototype.clear = function () {
        this._queuedItemMapping = [];
        this._items = [];
    };
    Queue.prototype.drain = function () {
    };
    Queue.prototype.debug = function (media) {
        var items = media.items.map(function (i) { return i.itemId + ": " + i.media.contentId; });
        console.log(items);
    };
    return Queue;
}());
exports.default = Queue;
