import Bind from './Bind'
import { PlayerEventDelegate } from './PlayerEvent'
import Media, { AbstractMetaData } from './Media'

const onAvailableCallbackId = '__onGCastApiAvailable'

export interface PartialOptions {
  autoJoinPolicy?: chrome.cast.AutoJoinPolicy
  receiverApplicationId?: string
  language?: string
}

export class CastOptions {
  private _options: cast.framework.CastOptions
  constructor() {
    this._options = {
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
      receiverApplicationId: 'CC1AD845',
      language: 'en'
    }
  }

  setOptions(options: PartialOptions) {
    this._options = { ...this._options, ...options }
  }

  get options(): cast.framework.CastOptions {
    return this._options
  }
}

class ChromecastInstance {

  private _ready = false
  private _options: CastOptions
  private _context: cast.framework.CastContext
  private _session: cast.framework.CastSession
  private _mediaSession: chrome.cast.Session
  private _player: cast.framework.RemotePlayer
  private _controller: cast.framework.RemotePlayerController
  private _eventHandler: PlayerEventDelegate
  private _mediaQueue: chrome.cast.media.QueueItem[] = []
  private _readyStateListener: () => void = () => { }
  private _errorListener: (e: chrome.cast.Error) => void = () => { }

  constructor() {
    this._eventHandler = new PlayerEventDelegate()
  }

  isReady(): boolean {
    return this._ready
  }

  initializeCastService(options?: PartialOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof chrome.cast === 'undefined') {
        const t = document.createElement('script')
        t.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'
        document.body.appendChild(t)
        window[onAvailableCallbackId] = (available: boolean) => {
          if (available) {
            this._context = cast.framework.CastContext.getInstance()
            this._context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
              this.onSessionStateChange)
            this._options = new CastOptions()
            if (options)
              this._options.setOptions(options)
            this._context.setOptions(this._options.options)
            resolve()
          } else {
            reject(new Error('Cast service is not available'))
          }
        }
      }
    })
  }

  setReadyStateListner(listener: () => void) {
    this._readyStateListener = listener
  }

  setErrorListener(listener: (e: chrome.cast.Error) => void) {
    this._errorListener = listener
  }

  get eventDelegate(): PlayerEventDelegate {
    return this._eventHandler
  }

  get controller(): cast.framework.RemotePlayerController {
    return this._controller
  }

  get player(): cast.framework.RemotePlayer {
    return this._player
  }

  disconnect() {
    this._session.endSession(true)
    this.removeListeners()
    this._ready = false
  }

  newMediaEntity(mediaId: string, mimeType: string): chrome.cast.media.MediaInfo
  newMediaEntity(mediaId: string, mimeType: string, title: string): chrome.cast.media.MediaInfo
  newMediaEntity(mediaId: string, mimeType: string, title: string, image: string): chrome.cast.media.MediaInfo
  newMediaEntity(mediaId: string, mimeType: string, title?: string, image?: string, meta?: AbstractMetaData): chrome.cast.media.MediaInfo
  newMediaEntity(mediaId: string, mimeType: string, title?: string, image?: string, meta?: AbstractMetaData): chrome.cast.media.MediaInfo {
    return Media.newEntity(mediaId, mimeType, title, image, meta)
  }

  playOne(media: chrome.cast.media.MediaInfo) {
    const request = new chrome.cast.media.LoadRequest(media)
    this._session.loadMedia(request)
      .then(
        this.onMediaLoaded,
        this.onMediaLoadError)
      .catch(console.error)
  }

  queue(items: chrome.cast.media.MediaInfo[]) {
    items.forEach(i => this._mediaQueue.push(new chrome.cast.media.QueueItem(i)))
  }

  addToQueue(item: chrome.cast.media.MediaInfo) {
    this._mediaQueue.push(new chrome.cast.media.QueueItem(item))
  }

  startQueue() {
    const request = new chrome.cast.media.QueueLoadRequest(this._mediaQueue)
    this._mediaSession.queueLoad(request, this.onMediaLoaded, this.onError)
  }

  @Bind
  private onSessionStateChange(event: cast.framework.SessionStateEventData) {
    switch (event.sessionState) {
      case cast.framework.SessionState.SESSION_ENDED:
        break
      case cast.framework.SessionState.SESSION_STARTED:
        this._session = this._context.getCurrentSession()
        this._mediaSession = this._session.getSessionObj()
        this._readyStateListener()
        break
    }
  }

  @Bind
  private onMediaLoaded() {
    this.removeListeners()
    this._player = new cast.framework.RemotePlayer()
    this._controller = new cast.framework.RemotePlayerController(this._player)
    this._controller.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent)
  }

  @Bind
  private onMediaLoadError(errorCode: chrome.cast.ErrorCode) {
    this._errorListener(new chrome.cast.Error(errorCode))
  }

  @Bind
  private onError(error: chrome.cast.Error) {
    this._errorListener(error)
  }

  @Bind
  private onPlayerEvent(event: cast.framework.RemotePlayerChangedEvent) {
    this._eventHandler.invoke(event.field, event.value)
  }

  private removeListeners() {
    if (!!this._controller)
      this._controller.removeEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent)
  }
}

const Chromecast = new ChromecastInstance()
export default Chromecast
