import Chromecast from './Chromecast'

class MediaControllerInstance {

  togglePlay() {
    Chromecast.controller.playOrPause()
  }

  toggleMute() {
    Chromecast.controller.muteOrUnmute()
  }

  seek(seconds: number) {
    Chromecast.player.currentTime = Chromecast.player.currentTime + seconds
    Chromecast.controller.seek()
  }

  seekToTime(seconds: number) {
    const { duration } = Chromecast.player
    if (seconds > duration)
      throw new Error(`Controller::seekToTime - Cannot seek beyond duration bounds; max value is ${duration}`)
    Chromecast.player.currentTime = seconds
    Chromecast.controller.seek()
  }

  /**
   * Seeks to a percentage of media
   * @param ratio percentage of media to seek to, as float value 0 to 1
   */
  seekToPercentage(ratio: number) {
    const { duration } = Chromecast.player
    if (ratio > 1)
      throw new Error('Controller::seekToPercentage - Ratio value must be a floating point number between 0 and 1')
    Chromecast.player.currentTime = duration * ratio
    Chromecast.controller.seek()
  }

  stop(drainQueue?: boolean) {
    if (drainQueue) {
      Chromecast.queue.drain()
    }
    Chromecast.controller.stop()
  }

  adjustVolume(volume: number) {
    if (volume > 1)
      throw new Error('Controller::adjustVolume - Volume value must be a floating point number between 0 and 1')
    Chromecast.player.volumeLevel = volume
    Chromecast.controller.setVolumeLevel()
  }

  rewind() {
    this.seekToTime(0)
  }
}

const Controller = new MediaControllerInstance()
export default Controller
