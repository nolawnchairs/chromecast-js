import Chromecast from './Chromecast'
import { UnregisterHook, Listeners } from './PlayerEvent'

export default class Register {

  static forCastEvents(handler: Listeners.CastEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerCastEventListener(handler)
  }

  static forPlaybackEvents(handler: Listeners.PlaybackEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerPlaybackEventListener(handler)
  }

  static forPlayerCapabilityEvents(handler: Listeners.PlayerCapabilityEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerPlayerCapabilityListener(handler)
  }

  static forQueueEvents(handler: Listeners.QueueEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerQueueEventListener(handler)
  }

  static forEvents(handler: Listeners.NativeEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerNativeEventListener(handler)
  }

  static unregisterAll() {
    Chromecast.eventDelegate.removeAll()
  }
}
