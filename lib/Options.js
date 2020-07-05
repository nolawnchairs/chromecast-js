"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastOptions = exports.AutoJoinPolicy = void 0;
var tslib_1 = require("tslib");
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
            language: 'en',
            resumeSavedSession: false
        };
    }
    CastOptions.prototype.setOptions = function (options) {
        this._options = tslib_1.__assign(tslib_1.__assign({}, this._options), options);
    };
    Object.defineProperty(CastOptions.prototype, "options", {
        get: function () {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    return CastOptions;
}());
exports.CastOptions = CastOptions;
