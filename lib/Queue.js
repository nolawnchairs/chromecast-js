"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Queue = (function () {
    function Queue(items) {
        this._cursor = 0;
        this._items = [];
        this._items = items;
    }
    Queue.prototype.add = function (media) {
        this._items.push(media);
    };
    Queue.prototype.next = function () {
        if (this._cursor + 1 <= this._items.length)
            return this._items[++this._cursor];
        return null;
    };
    Queue.prototype.previous = function () {
        if (this._cursor > 0)
            return this._items[--this._cursor];
        return null;
    };
    Queue.prototype.first = function () {
        this._cursor = 0;
        return this._items[0];
    };
    Queue.prototype.last = function () {
        this._cursor = this._items.length - 1;
        return this._items[this._cursor];
    };
    return Queue;
}());
exports.Queue = Queue;
