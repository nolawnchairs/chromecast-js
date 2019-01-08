import Bind from './Bind'
import { PlayerEventDelegate, EventType, HandlerFn } from './PlayerEvent'
import Media, { AbstractMetaData } from './Media'
import MediaQueue, { QueueEventType } from './MediaQueue'
import { CastOptions, Options } from './Options'

const onAvailableCallbackId = '__onGCastApiAvailable'

class ChromecastInstance {

  private _ready = false
  private _options: CastOptions
  private _context: cast.framework.CastContext
  private _castSession: cast.framework.CastSession
  private _player: cast.framework.RemotePlayer
  private _controller: cast.framework.RemotePlayerController
  private _eventDelegate: PlayerEventDelegate
  private _queue: MediaQueue
  private _readyStateListener: () => void = () => { }
  private _shutdownStateListener: () => void = () => { }
  private _errorListener: (e: chrome.cast.Error) => void = () => { }

  //#region main
  readonly AutoJoinPolicy = {
    CUSTOM_CONTROLLER_SCOPED: 'custom_controller_scoped',
    TAB_AND_ORIGIN_SCOPED: 'tab_and_origin_scoped',
    ORIGIN_SCOPED: 'origin_scoped',
    PAGE_SCOPED: 'page_scoped'
  }

  constructor() {
    this._queue = new MediaQueue()
    this._eventDelegate = new PlayerEventDelegate(this._queue)
    this._eventDelegate.setMediaCompleteListener(this.onMediaOrganicallyCompleted)
  }

  /**
   * Determine if the cast framework has loaded and
   * is ready for media
   */
  isReady(): boolean {
    return this._ready
  }

  /**
   * Initializes the cast framework
   * @param options Optional Options to set
   */
  initializeCastService(options?: Options): Promise<void> {
    return new Promise((resolve, reject) => {
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

  /**
   * Gets the PlayerEvent delegate
   */
  get eventDelegate(): PlayerEventDelegate {
    return this._eventDelegate
  }

  /**
   * Gets the current media controller instance
   */
  get controller(): cast.framework.RemotePlayerController {
    return this._controller
  }

  /**
   * Gets the current media player instance
   */
  get player(): cast.framework.RemotePlayer {
    return this._player
  }

  /**
   * Gets the current MediaQueue instance
   */
  get queue(): MediaQueue {
    return this._queue
  }

  /**
   * Set the listener to be invoked when the framework is loaded
   * and ready for media input
   * @param listener Listener to be invoked
   */
  setReadyStateListner(listener: () => void) {
    this._readyStateListener = listener
  }

  /**
   * Set the listener to be invoked when the media session ends
   * @param listener Listener to be invoked
   */
  setShutownStateListener(listener: () => void) {
    this._shutdownStateListener = listener
  }

  /**
   * Set the listener to be invoked when an error occurs
   * @param listener Listener to be invoked
   */
  setErrorListener(listener: (e: chrome.cast.Error) => void) {
    this._errorListener = listener
  }
  //#endregion

  /**
   * Disconnect entirely from the cast session
   */
  disconnect() {
    this._castSession.endSession(true)
    this._queue.clear()
    this.removeListeners()
    this._ready = false
  }

  /**
   * Adds a listener to a player event
   * @param event EventType to add
   * @param fn callback function
   */
  on(event: EventType, fn: HandlerFn) {
    this._eventDelegate.addListener(event, fn)
  }

  /**
   * Cancels a listener from a player event
   * @param event EventType to cancel
   */
  off(event: EventType) {
    this._eventDelegate.removeListener(event)
  }

  /**
   * Create a new MediaInfo entity
   * @param mediaId Media resource, usually a URL
   * @param mimeType Mime type of media
   * @param title optional title of media
   * @param image optional image related to media
   * @param meta optional meta data for the media
   */
  newMediaEntity(mediaId: string, mimeType: string): chrome.cast.media.MediaInfo
  newMediaEntity(mediaId: string, mimeType: string, title: string): chrome.cast.media.MediaInfo
  newMediaEntity(mediaId: string, mimeType: string, title: string, image: string): chrome.cast.media.MediaInfo
  newMediaEntity(mediaId: string, mimeType: string, title?: string, image?: string, meta?: AbstractMetaData): chrome.cast.media.MediaInfo
  newMediaEntity(mediaId: string, mimeType: string, title?: string, image?: string, meta?: AbstractMetaData): chrome.cast.media.MediaInfo {
    return Media.newEntity(mediaId, mimeType, title, image, meta)
  }

  /**
   * Load a single item into the play queue
   * @param item MediaInfo item
   */
  enqueue(item: chrome.cast.media.MediaInfo) {
    this.enqueueItems([item])
  }

  /**
   * Load multiple items into the play queue
   * @param items MediaInfo item array
   */
  enqueueItems(items: chrome.cast.media.MediaInfo[]) {
    this._queue.add(items)
  }

  /**
   * Append an item to the end of the play queue. Can only be
   * done after media playback has begun
   * @param item MediaInfo item
   */
  appendToQueue(item: chrome.cast.media.MediaInfo) {
    if (!this._queue.started)
      throw new Error('Chromecast::appendToQueue - Items cannot be appended before queued media has begun playback. Add your media items using Chromecast::queueItems before starting playback')
    this._queue.append(item)
    this.emitQueueEvent('queueInsert', this._queue.items)
  }

  /**
   * Remove an item from the play queue
   * @param item Queue index of item being removed
   */
  removeFromQueue(item: number) {
    if (!this._queue.started)
      throw new Error('Chromecast::removeFromQueue - Items cannot be removed before queued media has begun playback.')
    if (item >= this._queue.length)
      throw new Error(`Chromecast::removeFromQueue - Index out of bounds, attempt to reference index ${item} of ${this._queue.length} items`)
    if (this._queue.removeItem(item)) {
      this._controller.stop()
      this.loadItem(this._queue.current)
    }
    this.emitQueueEvent('queueRemove', this._queue.items)
  }

  /**
   * Moves an item to another position in the queue
   * @param from Queue index of item being moved
   * @param to The new index to move the item to
   */
  reorderQueue(from: number, to: number) {
    if (!this._queue.started)
      throw new Error('Chromecast::redorderQueue - Items cannot be reordered before queued media has begun playback.')
    if (from >= this._queue.length - 1)
      throw new Error(`Chromecast::reorderQueue - Index out of bounds, attempt to reference index ${from} of ${this._queue.length} items`)
    this._queue.reorderItem(from, to)
    this.emitQueueEvent('queueUpdate', this._queue.items)
  }

  /**
   * Clears the play queue entirely
   */
  clearQueue() {
    if (this._queue.started)
      this._controller.stop()
    this._queue.clear()
    this.emitQueueEvent('queueUpdate', this._queue.items)
  }

  /**
   * Start the playback queue
   * @param startingTime optional starting time of first item. Defaults to 0
   */
  startQueue(startingTime: number = 0) {
    if (this._queue.length == 0)
      throw new Error('Chromecast::startQueue - No items in queue')
    const item = this._queue.next()
    if (item) {
      this.loadItem(item, false, startingTime)
        .then(() => {
          this._queue.start()
          this.emitQueueEvent('queueItem', 0)
        })
        .catch(this.onMediaLoadError)
    }
  }

  /**
   * Advance the queue to the next item
   * @param isUserAction Whether or not action was performed by the user
   */
  advance(isUserAction: boolean = false) {
    const item = this._queue.next(isUserAction)
    if (item) {
      this.loadItem(item, isUserAction).catch(this.onMediaLoadError)
      this.emitQueueEvent('queueItem', this._queue.currentItem)
    }
  }

  /**
   * Play the next item in the queue, user requested
   */
  playNext() {
    this.advance(true)
  }

  /**
   * Play the previous item in the queue, user requested
   */
  playPrevious() {
    this._controller.stop()
    const item = this._queue.previous()
    if (item) {
      this.loadItem(item, true)
      this.emitQueueEvent('queueItem', this._queue.currentItem)
    }
  }

  /**
   * Create the controller for the currently playing media item
   */
  private createController() {
    this.removeListeners()
    this._controller = new cast.framework.RemotePlayerController(this._player)
    this._controller.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent)
  }

  /**
   * Loads and item into the cast session
   * @param item MediaInfo item
   * @param fromUser if this load is from user requesting next/previous or is organic
   * @param startTime optional start time of video
   */
  private async loadItem(item: chrome.cast.media.MediaInfo, fromUser: boolean = false, startTime = 0): Promise<void> {
    const request = new chrome.cast.media.LoadRequest(item)
    request.currentTime = startTime
    const loadError = await this._castSession.loadMedia(request)
    this.createController()

    // Set the queued item as user input or organic, and reset to organic
    // (false) after the video starts playback
    this._queue.setNextItemUserSelected(fromUser)
    const timeout = window.setTimeout(() => {
      this._queue.setNextItemUserSelected(false)
      window.clearTimeout(timeout)
    }, 1000)
    return loadError ? Promise.reject(loadError) : Promise.resolve()
  }

  /**
   * Called when the session state changes, take appropriate actions
   * @param event SessionStateEventData
   */
  @Bind
  private onSessionStateChange(event: cast.framework.SessionStateEventData) {
    switch (event.sessionState) {
      case cast.framework.SessionState.SESSION_ENDED:
        this._shutdownStateListener()
        break
      case cast.framework.SessionState.SESSION_STARTED:
      case cast.framework.SessionState.SESSION_RESUMED:
        this._castSession = this._context.getCurrentSession()
        this._player = new cast.framework.RemotePlayer()
        this._readyStateListener()
        break
    }
  }

  /**
   * Called when the current media item completes oganically, and plays the next
   */
  @Bind
  private onMediaOrganicallyCompleted() {
    this.playNext()
  }

  /**
   * Handler any media load errors, and delegate to listener
   * @param errorCode ErrorCode
   */
  @Bind
  private onMediaLoadError(errorCode: chrome.cast.ErrorCode) {
    this._errorListener(new chrome.cast.Error(errorCode))
  }

  /**
   * Invoked when any player event happens
   * delegate event emitting to eventDelegate
   * @param event the event
   */
  @Bind
  private onPlayerEvent(event: cast.framework.RemotePlayerChangedEvent) {
    this._eventDelegate.invoke(event.field as EventType, event.value)
  }

  /**
   * Emit a queue event
   * @param event QueueEventType
   * @param value Value to send
   */
  private emitQueueEvent(event: QueueEventType, value?: any) {
    this._eventDelegate.invoke(event as EventType, value)
  }

  /**
   * Remove listeners from controller
   */
  private removeListeners() {
    if (!!this._controller)
      this._controller.removeEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, this.onPlayerEvent)
  }
}

const Chromecast = new ChromecastInstance()
export default Chromecast
