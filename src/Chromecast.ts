import Bind from './Bind'
import { PlayerEventDelegate, EventType, HandlerFn } from './PlayerEvent'
import Media, { AbstractMetaData } from './Media'
import Queue, { QueueEventType } from './Queue'
import Controller from './Controller'

const onAvailableCallbackId = '__onGCastApiAvailable'

export enum AutoJoinPolicy {
  CUSTOM_CONTROLLER_SCOPED = 'custom_controller_scoped',
  TAB_AND_ORIGIN_SCOPED = 'tab_and_origin_scoped',
  ORIGIN_SCOPED = 'origin_scoped',
  PAGE_SCOPED = 'page_scoped'
}

export interface PartialOptions {
  autoJoinPolicy?: AutoJoinPolicy
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
  private _castSession: cast.framework.CastSession
  private _castSessionData: chrome.cast.Session
  private _player: cast.framework.RemotePlayer
  private _controller: cast.framework.RemotePlayerController
  private _eventDelegate: PlayerEventDelegate
  private _queue: Queue
  private _currentQueuetem = -1
  private _readyStateListener: () => void = () => { }
  private _shutdownStateListener: () => void = () => { }
  private _errorListener: (e: chrome.cast.Error) => void = () => { }

  readonly AutoJoinPolicy = {
    CUSTOM_CONTROLLER_SCOPED: 'custom_controller_scoped',
    TAB_AND_ORIGIN_SCOPED: 'tab_and_origin_scoped',
    ORIGIN_SCOPED: 'origin_scoped',
    PAGE_SCOPED: 'page_scoped'
  }

  constructor() {
    this._eventDelegate = new PlayerEventDelegate()
    this._queue = new Queue()
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

  setShutownStateListener(listener: () => void) {
    this._shutdownStateListener = listener
  }

  setErrorListener(listener: (e: chrome.cast.Error) => void) {
    this._errorListener = listener
  }

  get eventDelegate(): PlayerEventDelegate {
    return this._eventDelegate
  }

  get controller(): cast.framework.RemotePlayerController {
    return this._controller
  }

  get player(): cast.framework.RemotePlayer {
    return this._player
  }

  get session(): cast.framework.CastSession {
    return this._castSession
  }

  get currentQueueItem(): number {
    return this._currentQueuetem
  }

  getCurrentMedia(): chrome.cast.media.MediaInfo {
    return this._castSession.getMediaSession().media
  }

  disconnect() {
    this._castSession.endSession(true)
    this.removeListeners()
    this._ready = false
  }

  on(event: EventType, fn: HandlerFn) {
    this._eventDelegate.addListener(event, fn)
  }

  off(event: EventType) {
    this._eventDelegate.removeListener(event)
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
    this._castSession.loadMedia(request)
      .then(
        this.createController,
        this.onMediaLoadError)
      .catch(console.error)
  }

  queueItems(items: chrome.cast.media.MediaInfo[]) {
    this._queue.add(items.map(i => new chrome.cast.media.QueueItem(i)))
  }

  appendToQueue(item: chrome.cast.media.MediaInfo) {
    if (!this._queue.started)
      throw new Error('Chromecast::appendToQueue - Queue items cannot be appended before queued media has begun playback. Add your media items using Chromecast::queueItems before starting playback')
    this._queue.append(new chrome.cast.media.QueueItem(item), this._castSession.getMediaSession())
      .then(() => this.emitQueueEvent('queueInsert', this._queue.items))
      .catch(this.onError)
  }

  removeFromQueue(item: number) {
    if (!this._queue.started)
      throw new Error('Chromecast::removeFromQueue - Queue items cannot be removed before queued media has begun playback.')
    this._queue.removeItem(item, this._castSession.getMediaSession())
      .then(() => this.emitQueueEvent('queueRemove', this._queue.items))
      .catch(this.onError)
  }

  reorderQueue(items: number[], before?: number): void
  reorderQueue(item: number, before?: number): void
  reorderQueue() {
    if (arguments.length == 0)
      throw new Error('Chromecast::redorderQueue - no arguments')
    if (!this._queue.started)
      throw new Error('Chromecast::redorderQueue - Queue items cannot be reordered before queued media has begun playback.')
    const items: number[] = typeof arguments[0] == 'number' ? [arguments[0]] : arguments[0]
    this._queue.reorderItems(items, this._castSession.getMediaSession(), arguments[1] || null)
  }

  startQueue() {
    const request = new chrome.cast.media.QueueLoadRequest(this._queue.items)
    this._castSessionData.queueLoad(request, this.onQueueLoaded, this.onError)
  }

  restartCurrent() {
    Controller.seekToTime(0)
  }

  playNext() {
    this._castSession.getMediaSession().queueNext(this.onQueuedItemChange, this.onError)
  }

  playPrevious() {
    this._castSession.getMediaSession().queuePrev(this.onQueuedItemChange, this.onError)
  }

  private createController() {
    this.removeListeners()
    this._player = new cast.framework.RemotePlayer()
    this._controller = new cast.framework.RemotePlayerController(this._player)
    this._controller.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent)
  }

  @Bind
  private onSessionStateChange(event: cast.framework.SessionStateEventData) {
    switch (event.sessionState) {
      case cast.framework.SessionState.SESSION_ENDED:
        this._shutdownStateListener()
        break
      case cast.framework.SessionState.SESSION_STARTED:
        this._castSession = this._context.getCurrentSession()
        this._castSessionData = this._castSession.getSessionObj()
        this._readyStateListener()
        break
    }
  }

  private async awaitQueueChange() {
    return new Promise(resolve => {
      const i = window.setInterval(() => {
        if (this._castSession.getMediaSession() != null) {
          window.clearInterval(i)
          resolve()
        }
      }, 100)
    })
  }

  @Bind
  private onQueueLoaded() {
    this.createController()
    this._queue.start()
    this._currentQueuetem = 0
    this.emitQueueEvent('queueStart')
    this.emitQueueEvent('queueItem', 0)
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
  private onQueuedItemChange() {
    this.awaitQueueChange().then(() => {
      this._currentQueuetem = this._castSession.getMediaSession().currentItemId - 1
      this.emitQueueEvent('queueItem', this._currentQueuetem)
    })
  }

  @Bind
  private onPlayerEvent(event: cast.framework.RemotePlayerChangedEvent) {
    this._eventDelegate.invoke(event.field as EventType, event.value)
  }

  @Bind
  private emitQueueEvent(event: QueueEventType, value?: any) {
    this._eventDelegate.invoke(event as EventType, value)
  }

  private removeListeners() {
    if (!!this._controller)
      this._controller.removeEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent)
  }
}

const Chromecast = new ChromecastInstance()
export default Chromecast
