import Bind from './Bind'
import MediaQueue, { QueueEventType } from './MediaQueue'

export type HandlerFn = (value: any) => void

export interface QueueEvent {
  onStarted(): void
  onStopped(): void
  onUpdated(): void
  onItemChanged(item: number): void
}

export type EventType = 'isConnected' | 'isMediaLoaded' | 'duration'
  | 'currentTime' | 'isPaused' | 'volumeLevel' | 'canControlVolume'
  | 'isMuted' | 'canPause' | 'canSeek' | 'displayName' | 'statusText'
  | 'title' | 'displayStatus' | 'imageUrl'
  | 'mediaInfo' | 'playerState' | QueueEventType

export class PlayerEventDelegate {

  private _queue: MediaQueue
  private _mediaCompleteListener: () => void
  private _listeners: Map<EventType, HandlerFn> = new Map()
  private _allHandlers: (event: EventType, value: any) => void = null
  private _queueListeners: Map<number, QueueEvent> = new Map()

  constructor(queue: MediaQueue) {
    this._queue = queue
    this.bind('isMediaLoaded', this.isMediaLoaded)
    //this.bind('mediaInfo', this.onMediaInfoChanged)
    this.bind('playerState', this.onPlayerState)
    this.bind('queueStart', this.onQueueStart)
    this.bind('queueComplete', this.onQueueStopped)
    this.bind('queueInsert', this.onQueueUpdated)
    this.bind('queueRemove', this.onQueueUpdated)
    this.bind('queueUpdate', this.onQueueUpdated)
    this.bind('queueItem', this.onQueueItemChanged)

  }

  private bind(id: EventType, handler: (value: any) => void) {
    this._listeners.set(id, handler)
  }

  removeAll() {
    this._listeners.clear()
    this._queueListeners.clear()
    this._allHandlers = null
  }

  addListener(event: EventType, handler: HandlerFn) {
    this._listeners.set(event, handler)
  }

  removeListener(event: EventType) {
    this._listeners.delete(event)
  }

  setMediaCompleteListener(listener: () => void) {
    this._mediaCompleteListener = listener
  }

  setAnyEventListener(listener: (event: EventType, value: any) => void) {
    this._allHandlers = listener
  }

  invoke(eventId: EventType, value: any) {
    if (this._allHandlers) {
      this._allHandlers(eventId, value)
    }
    if (this._listeners.has(eventId)) {
      this._listeners.get(eventId)(value)
    }
  }

  @Bind
  private onPlayerState(state: string) {
    if (state == null) {
      this._queueListeners.forEach(l => l.onStopped())
    }
  }

  // @Bind
  // private isMediaLoaded(is: boolean) {
  //   if (is) {
  //     this._castListeners.forEach(l => l.onMediaLoaded())
  //   } else {
  //     this._castListeners.forEach(l => l.onMediaUnloaded())
  //     if (!this._queue.isNextItemUserSelected())
  //       this._mediaCompleteListener()
  //   }
  // }

  @Bind
  private isMediaLoaded(is: boolean) {
    if (!is && !this._queue.isNextItemUserSelected()) {
      this._mediaCompleteListener()
    }
  }

  @Bind
  private onQueueStart() {
    this._queueListeners.forEach(l => l.onStarted())
  }

  @Bind
  private onQueueStopped() {
    this._queueListeners.forEach(l => l.onStopped())
  }

  @Bind
  private onQueueUpdated() {
    this._queueListeners.forEach(l => l.onUpdated())
  }

  @Bind
  private onQueueItemChanged(item: number) {
    this._queueListeners.forEach(l => l.onItemChanged(item))
  }
}
