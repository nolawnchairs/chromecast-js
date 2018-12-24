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
