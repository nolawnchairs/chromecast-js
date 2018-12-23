import Chromecast from './Chromecast'
import { UnregisterHook, Listeners } from './PlayerEvent'

export default class Register {

  static forConnectionEvent(listener: Listeners.CastEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerConnectionEventListener(listener)
  }

  static forPlayerEvent(listener: Listeners.PlaybackEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerPlaybackEventListener(listener)
  }

  static forPlayerCapabilityEvent(listener: Listeners.PlayerCapabilityEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerPlayerCapabilityListener(listener)
  }

  static forNativeEvent(listener: Listeners.NativeEvent): UnregisterHook {
    return Chromecast.eventDelegate.registerNativeEventListener(listener)
  }
}
