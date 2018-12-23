/// <reference types="chrome" />
/// <reference types="chromecast-caf-sender" />
/// <reference types="filesystem" />
/// <reference types="filewriter" />

export declare type HandlerFn = (value: any) => void;
export declare type UnregisterHook = () => void;
export declare namespace Listeners {
  interface PlaybackEvent {
    onTimeUpdate(time: number): void;
    onPaused(): void;
    onPlaying(): void;
    onBuffering(): void;
    onIdle(): void;
    onStop(): void;
    onMuteChange(muted: boolean): void;
    onVolumeChanged(volume: number): void;
    onEnded(): void;
  }
  interface CastEvent {
    onConnected(): void;
    onDisconnected(): void;
    onMediaLoaded(): void;
    onMediaUnloaded(): void;
    onMediaInfoChanged(info: chrome.cast.media.MediaInfo): void;
    onDurationChanged(duration: number): void;
    onDisplayNameChanged(name: string): void;
    onDisplayStatusChanged(displayStatus: string): void;
    onStatusTextChanged(statusText: string): void;
    onTitleChanged(title: string): void;
    onImageUrlChanged(url: string): void;
  }
  interface PlayerCapabilityEvent {
    canChangeVolume(can: boolean): void;
    canSeek(can: boolean): void;
    canPause(can: boolean): void;
  }
  interface NativeEvent {
    onEvent(eventId: string, value: any): void;
  }
}
export declare class PlayerEventDelegate {
  private _handlers;
  private _playbackListeners;
  private _castListeners;
  private _playerCapabilityListeners;
  private _nativeEventListeners;
  constructor();
  private bind;
  registerPlaybackEventListener(listener: Listeners.PlaybackEvent): UnregisterHook;
  registerConnectionEventListener(listener: Listeners.CastEvent): UnregisterHook;
  registerPlayerCapabilityListener(listener: Listeners.PlayerCapabilityEvent): UnregisterHook;
  registerNativeEventListener(listener: Listeners.NativeEvent): UnregisterHook;
  invoke(eventId: string, value: any): void;
  private isConnected;
  private onTimeChange;
  private onPlayerState;
  private isMediaLoaded;
  private onDurationChanged;
  private onMediaInfoChanged;
  private onMuteChange;
  private onVolumeLevel;
  private onPaused;
  private onDisplayNameChanged;
  private onStatusTextChange;
  private onTitleChange;
  private onDisplayStatusChange;
  private onImageUrlChange;
  private canControlVolume;
  private canPause;
  private canSeek;
}

export declare type AbstractMetaData = chrome.cast.media.GenericMediaMetadata | chrome.cast.media.MovieMediaMetadata | chrome.cast.media.MusicTrackMediaMetadata | chrome.cast.media.PhotoMediaMetadata;
export interface MediaOptions {
  mediaId: string;
  mimeType: string;
  title?: string;
  image?: string;
  meta?: AbstractMetaData;
}
declare class MediaImpl {
  private _imageProps;
  setDefaultImageProperties(w: number, h: number): void;
  newEntity(mediaId: string, mimeType: string, title?: string, image?: string, meta?: AbstractMetaData): chrome.cast.media.MediaInfo;
}
export declare const Media: MediaImpl;

export interface PartialOptions {
  autoJoinPolicy?: chrome.cast.AutoJoinPolicy;
  receiverApplicationId?: string;
  language?: string;
}
export declare class CastOptions {
  private _options;
  constructor();
  setOptions(options: PartialOptions): void;
  readonly options: cast.framework.CastOptions;
}
declare class ChromecastInstance {
  private _ready;
  private _options;
  private _context;
  private _session;
  private _mediaSession;
  private _player;
  private _controller;
  private _eventHandler;
  private _mediaQueue;
  private _readyStateListener;
  private _errorListener;
  constructor();
  isReady(): boolean;
  initializeCastService(options?: PartialOptions): Promise<void>;
  setReadyStateListner(listener: () => void): void;
  setErrorListener(listener: (e: chrome.cast.Error) => void): void;
  readonly eventDelegate: PlayerEventDelegate;
  readonly controller: cast.framework.RemotePlayerController;
  readonly player: cast.framework.RemotePlayer;
  disconnect(): void;
  newMediaEntity(mediaId: string, mimeType: string): chrome.cast.media.MediaInfo;
  newMediaEntity(mediaId: string, mimeType: string, title: string): chrome.cast.media.MediaInfo;
  newMediaEntity(mediaId: string, mimeType: string, title: string, image: string): chrome.cast.media.MediaInfo;
  newMediaEntity(mediaId: string, mimeType: string, title?: string, image?: string, meta?: AbstractMetaData): chrome.cast.media.MediaInfo;
  playOne(media: chrome.cast.media.MediaInfo): void;
  queue(items: chrome.cast.media.MediaInfo[]): void;
  addToQueue(item: chrome.cast.media.MediaInfo): void;
  startQueue(): void;
  private onSessionStateChange;
  private onMediaLoaded;
  private onMediaLoadError;
  private onError;
  private onPlayerEvent;
  private removeListeners;
}
export declare const Chromecast: ChromecastInstance;


export declare class Register {
  static forConnectionEvent(listener: Listeners.CastEvent): UnregisterHook;
  static forPlayerEvent(listener: Listeners.PlaybackEvent): UnregisterHook;
  static forPlayerCapabilityEvent(listener: Listeners.PlayerCapabilityEvent): UnregisterHook;
  static forNativeEvent(listener: Listeners.NativeEvent): UnregisterHook;
}
declare class MediaControllerInstance {
  togglePlay(): void;
  toggleMute(): void;
  seek(seconds: number): void;
  seekToTime(seconds: number): void;
  seekToPercentage(ratio: number): void;
  stop(): void;
  adjustVolume(volume: number): void;
}
export declare const Controller: MediaControllerInstance;

