import Chromecast from './Chromecast'
import { UnregisterHook, Listeners } from './PlayerEvent'

export default class Register {

  static forConnectionEvents(listener: Listeners.CastEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerConnectionEventListener(listener)
  }

  static forPlayerEvents(listener: Listeners.PlaybackEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerPlaybackEventListener(listener)
  }

  static forPlayerCapabilityEvents(listener: Listeners.PlayerCapabilityEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerPlayerCapabilityListener(listener)
  }

  static forQueueEvents(listener: Listeners.QueueEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerQueueEventListener(listener)
  }

  static forEvents(listener: Listeners.NativeEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerNativeEventListener(listener)
  }
}
