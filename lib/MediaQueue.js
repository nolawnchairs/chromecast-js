"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ItemChangeActor;
(function (ItemChangeActor) {
    ItemChangeActor[ItemChangeActor["Automatic"] = 0] = "Automatic";
    ItemChangeActor[ItemChangeActor["User"] = 1] = "User";
})(ItemChangeActor || (ItemChangeActor = {}));
var MediaQueue = (function () {
    function MediaQueue() {
        this._started = false;
        this._items = [];
        this._currentItem = -1;
        this._nextActor = ItemChangeActor.Automatic;
        window['__queue'] = this;
    }
    Object.defineProperty(MediaQueue.prototype, "started", {
        get: function () {
            return this._started;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MediaQueue.prototype, "items", {
        get: function () {
            return this._items;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MediaQueue.prototype, "length", {
        get: function () {
            return this._items.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MediaQueue.prototype, "currentItem", {
        get: function () {
            return this._currentItem;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MediaQueue.prototype, "current", {
        get: function () {
            return this._items[this._currentItem];
        },
        enumerable: true,
        configurable: true
    });
    MediaQueue.prototype.start = function () {
        this._started = true;
        this._currentItem = 0;
    };
    MediaQueue.prototype.isNextItemUserSelected = function () {
        return this._nextActor == ItemChangeActor.User;
    };
    MediaQueue.prototype.setNextItemUserSelected = function (is) {
        this._nextActor = is ? ItemChangeActor.User : ItemChangeActor.Automatic;
    };
    MediaQueue.prototype.end = function (clear) {
        this._started = false;
        if (clear)
            this.clear();
    };
    MediaQueue.prototype.next = function (isUserAction) {
        if (isUserAction === void 0) { isUserAction = false; }
        if (this._currentItem < this.length) {
            var nextItem = this._currentItem + 1;
            this._currentItem = nextItem;
            if (isUserAction)
                this._nextActor = ItemChangeActor.User;
            return this._items[nextItem];
        }
        return null;
    };
    MediaQueue.prototype.previous = function () {
        if (this._currentItem > 0) {
            var nextItem = this._currentItem - 1;
            this._currentItem = nextItem;
            this._nextActor = ItemChangeActor.User;
            return this._items[nextItem];
        }
        return null;
    };
    MediaQueue.prototype.drain = function () {
        this._items.splice(this._currentItem + 1, this._items.length - this._currentItem);
    };
    MediaQueue.prototype.clear = function () {
        this._started = false;
        this._currentItem = -1;
        this._items = [];
    };
    MediaQueue.prototype.add = function (items) {
        var _a;
        (_a = this._items).push.apply(_a, items);
    };
    MediaQueue.prototype.append = function (item) {
        this._items.push(item);
    };
    MediaQueue.prototype.removeItem = function (id) {
        this._items.splice(id, 1);
        return id == this._currentItem;
    };
    MediaQueue.prototype.reorderItem = function (from, to) {
        var _a;
        (_a = this._items).splice.apply(_a, [to, 0].concat(this._items.splice(from, 1)));
    };
    return MediaQueue;
}());
exports.default = MediaQueue;
