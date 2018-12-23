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
