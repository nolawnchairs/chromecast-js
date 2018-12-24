import Bind from './Bind'
import Chromecast from './Chromecast'
import { QueueEventType } from './Queue'

export type HandlerFn = (value: any) => void
export type UnregisterHook = () => void

export namespace Listeners {

  export interface PlaybackEvent {
    onTimeUpdate(time: number): void
    onPaused(): void
    onPlaying(): void
    onBuffering(): void
    onIdle(): void
    onStop(): void
    onMuteChange(muted: boolean): void
    onVolumeChanged(volume: number): void
    onEnded(): void
  }

  export interface CastEvent {
    onConnected(): void
    onDisconnected(): void
    onMediaLoaded(): void
    onMediaUnloaded(): void
    onMediaInfoChanged(info: chrome.cast.media.MediaInfo): void
    onDurationChanged(duration: number): void
    onDisplayNameChanged(name: string): void
    onDisplayStatusChanged(displayStatus: string): void
    onStatusTextChanged(statusText: string): void
    onTitleChanged(title: string): void
    onImageUrlChanged(url: string): void
  }

  export interface PlayerCapabilityEvent {
    canChangeVolume(can: boolean): void
    canSeek(can: boolean): void
    canPause(can: boolean): void
  }

  export interface QueueEvent {
    onLoaded(): void
    onStarted(): void
    onStopped(): void
    onUpdated(): void
    onItemChanged(item: number): void
  }

  export interface NativeEvent {
    onEvent(eventId: string, value: any): void
  }
}

export type EventType = 'isConnected' | 'isMediaLoaded' | 'duration'
  | 'currentTime' | 'isPaused' | 'volumeLevel' | 'canControlVolume'
  | 'isMuted' | 'canPause' | 'canSeek' | 'displayName' | 'statusText'
  | 'title' | 'displayStatus' | 'imageUrl'
  | 'mediaInfo' | 'playerState' | & QueueEventType

export class PlayerEventDelegate {

  private _handlers: Map<string, HandlerFn> = new Map()
  private _listeners: Map<EventType, HandlerFn> = new Map()
  private _playbackListeners: Map<number, Listeners.PlaybackEvent> = new Map()
  private _castListeners: Map<number, Listeners.CastEvent> = new Map()
  private _playerCapabilityListeners: Map<number, Listeners.PlayerCapabilityEvent> = new Map()
  private _queueListeners: Map<number, Listeners.QueueEvent> = new Map()
  private _nativeEventListeners: Map<number, Listeners.NativeEvent> = new Map()
  private _currentInfo: chrome.cast.media.MediaInfo = null

  constructor() {
    this.bind('isConnected', this.isConnected)
    this.bind('isMediaLoaded', this.isMediaLoaded)
    this.bind('duration', this.onDurationChanged)
    this.bind('currentTime', this.onTimeChange)
    this.bind('isPaused', this.onPaused)
    this.bind('volumeLevel', this.onVolumeLevel)
    this.bind('canControlVolume', this.canControlVolume)
    this.bind('isMuted', this.onMuteChange)
    this.bind('canPause', this.canPause)
    this.bind('canSeek', this.canSeek)
    this.bind('displayName', this.onDisplayNameChanged)
    this.bind('statusText', this.onStatusTextChange)
    this.bind('title', this.onTitleChange)
    this.bind('displayStatus', this.onDisplayStatusChange)
    this.bind('imageUrl', this.onImageUrlChange)
    this.bind('mediaInfo', this.onMediaInfoChanged)
    this.bind('playerState', this.onPlayerState)
    this.bind('queueLoad', this.onQueueLoaded)
    this.bind('queueStart', this.onQueueStart)
    this.bind('queueComplete', this.onQueueStopped)
    this.bind('queueInsert', this.onQueueUpdated)
    this.bind('queueRemove', this.onQueueUpdated)
    this.bind('queueItem', this.onQueueItemChanged)
  }

  private bind(id: EventType, handler: (value: any) => void) {
    this._handlers.set(id, handler)
  }

  addListener(event: EventType, handler: HandlerFn) {
    this._listeners.set(event, handler)
  }

  registerPlaybackEventListener(listener: Listeners.PlaybackEvent): UnregisterHook {
    const random = Math.random()
    this._playbackListeners.set(random, listener)
    return () => this._playbackListeners.delete(random)
  }

  registerConnectionEventListener(listener: Listeners.CastEvent): UnregisterHook {
    const random = Math.random()
    this._castListeners.set(random, listener)
    return () => this._castListeners.delete(random)
  }

  registerPlayerCapabilityListener(listener: Listeners.PlayerCapabilityEvent): UnregisterHook {
    const random = Math.random()
    this._playerCapabilityListeners.set(random, listener)
    return () => this._playerCapabilityListeners.delete(random)
  }

  registerQueueEventListener(listener: Listeners.QueueEvent): UnregisterHook {
    const random = Math.random()
    this._queueListeners.set(random, listener)
    return () => this._queueListeners.delete(random)
  }

  registerNativeEventListener(listener: Listeners.NativeEvent): UnregisterHook {
    const random = Math.random()
    this._nativeEventListeners.set(random, listener)
    return () => this._nativeEventListeners.delete(random)
  }

  invoke(eventId: EventType, value: any) {
    this._nativeEventListeners.forEach(l => l.onEvent(eventId, value))
    if (this._handlers.has(eventId)) {
      this._handlers.get(eventId)(value)
    }
    if (this._listeners.has(eventId)) {
      this._listeners.get(eventId)(value)
    }
  }

  private matchMedia(that: chrome.cast.media.MediaInfo): boolean {
    if (!this._currentInfo || !that)
      return false
    return this._currentInfo.contentId == that.contentId
  }

  @Bind
  private isConnected(is: boolean) {
    if (is) {
      this._castListeners.forEach(l => l.onConnected())
    } else {
      this._castListeners.forEach(l => l.onDisconnected())
    }
  }

  @Bind
  private onTimeChange(time: number) {
    this._playbackListeners.forEach(l => l.onTimeUpdate(time))
  }

  @Bind
  private onPlayerState(state: string) {
    if (state == null) {
      this._queueListeners.forEach(l => l.onStopped())
      return
    }
    switch (state) {
      case 'IDLE':
        this._playbackListeners.forEach(l => l.onIdle())
        break
      case 'PLAYING':
        this._playbackListeners.forEach(l => l.onPlaying())
        break
      case 'PAUSED':
        this._playbackListeners.forEach(l => l.onPaused())
        break
      case 'BUFFERING':
        this._playbackListeners.forEach(l => l.onBuffering())
        break
    }
  }

  @Bind
  private isMediaLoaded(is: boolean) {
    if (is) {
      this._castListeners.forEach(l => l.onMediaLoaded())
    } else {
      this._castListeners.forEach(l => l.onMediaUnloaded())
    }
  }

  @Bind
  private onDurationChanged(duration: number) {
    this._castListeners.forEach(l => l.onDurationChanged(duration))
  }

  @Bind
  private onMediaInfoChanged(info: chrome.cast.media.MediaInfo) {
    this._castListeners.forEach(l => l.onMediaInfoChanged(info))
    if (!this.matchMedia(info) && !!this._currentInfo) {
      this._playbackListeners.forEach(l => l.onEnded())
      this._queueListeners.forEach(l => l.onItemChanged(Chromecast.currentQueueItem))
      this._currentInfo = info
    }
  }

  @Bind
  private onMuteChange(is: boolean) {
    this._playbackListeners.forEach(l => l.onMuteChange(is))
  }

  @Bind
  private onVolumeLevel(volume: number) {
    this._playbackListeners.forEach(l => l.onVolumeChanged(volume))
  }

  @Bind
  private onPaused(paused: boolean) {
    if (paused) {
      this._playbackListeners.forEach(l => l.onPaused())
    }
  }

  @Bind
  private onDisplayNameChanged(name: string) {
    this._castListeners.forEach(l => l.onDisplayNameChanged(name))
  }

  @Bind
  private onStatusTextChange(text: string) {
    this._castListeners.forEach(l => l.onStatusTextChanged(text))
  }

  @Bind
  private onTitleChange(title: string) {
    this._castListeners.forEach(l => l.onTitleChanged(title))
  }

  @Bind
  private onDisplayStatusChange(status: string) {
    this._castListeners.forEach(l => l.onDisplayStatusChanged(status))
  }

  @Bind
  private onImageUrlChange(url: string) {
    this._castListeners.forEach(l => l.onImageUrlChanged(url))
  }

  @Bind
  private canControlVolume(can: boolean) {
    this._playerCapabilityListeners.forEach(l => l.canChangeVolume(can))
  }

  @Bind
  private canPause(can: boolean) {
    this._playerCapabilityListeners.forEach(l => l.canPause(can))
  }

  @Bind
  private canSeek(can: boolean) {
    this._playerCapabilityListeners.forEach(l => l.canSeek(can))
  }

  @Bind
  private onQueueLoaded() {
    this._queueListeners.forEach(l => l.onLoaded())
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
