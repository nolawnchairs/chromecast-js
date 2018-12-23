
export type AbstractMetaData = chrome.cast.media.GenericMediaMetadata
  | chrome.cast.media.MovieMediaMetadata
  | chrome.cast.media.MusicTrackMediaMetadata
  | chrome.cast.media.PhotoMediaMetadata

export interface MediaOptions {
  mediaId: string
  mimeType: string
  title?: string
  image?: string
  meta?: AbstractMetaData
}

class MediaImpl {

  private _imageProps: { w: number, h: number } = null

  setDefaultImageProperties(w: number, h: number) {
    this._imageProps = { w, h }
  }

  newEntity(mediaId: string, mimeType: string, title?: string, image?: string, meta?: AbstractMetaData): chrome.cast.media.MediaInfo {
    const media = new chrome.cast.media.MediaInfo(mediaId, mimeType)
    const metadata = new chrome.cast.media.GenericMediaMetadata()
    metadata.title = title || null
    if (!!image) {
      const i = new chrome.cast.Image(image)
      if (this._imageProps) {
        i.width = this._imageProps.w
        i.height = this._imageProps.h
      }
      metadata.images = []
      metadata.images.push(i)
    }
    if (!!title) {
      metadata.title = title
    }

    media.metadata = metadata

    if (!!meta && (!image || !title)) {
      media.metadata = meta
    }

    return media
  }
}

const Media = new MediaImpl()
export default Media
