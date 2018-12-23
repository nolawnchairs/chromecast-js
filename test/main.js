
const { Chromecast, Register, Controller } = require('..')

const toggle = document.getElementById('pp')
toggle.addEventListener('click', () => Controller.togglePlay())

const stop = document.getElementById('stop')
stop.addEventListener('click', () => {
  Controller.stop()
  Chromecast.disconnect()
})

const seek = document.getElementById('seek')
seek.addEventListener('click', () => Controller.seekToPercentage(.98))

const options = {
  receiverApplicationId: '87F34079',
  autoJoinPolicy: 'origin_scoped'
}

const videoQueue = []

Chromecast.initializeCastService(options)
  .catch(console.error)
Chromecast.setReadyStateListner(() => onReady())

function createEntity(url, title, image) {
  const item = Chromecast.newMediaEntity(url, 'video/mp4', title, image)
  videoQueue.push(item)
}

function onReady() {
  createEntity('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Big Buck Bunny', 'https://payloads.enaturelive.com/posters/0EE08B6A217E0ADC/T-3B709EC02A1BEE9A.JPG')
  createEntity('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', "Elephant's Dream", 'https://payloads.enaturelive.com/posters/EA7A70A934B8539B/T-2B5081B5E19F2471.jpg')
  Chromecast.queue(videoQueue)
  Chromecast.startQueue()

  Register.forNativeEvent({
    onEvent(event, value) {
      console.log(event, value)
    }
  })
  
  Register.forPlayerEvent({
    onTimeUpdate(time) {},
    onPaused() {},
    onPlaying() {},
    onBuffering() {},
    onIdle() {},
    onStop() {},
    onMuteChange(muted) {},
    onVolumeChanged(volume) {},
    onEnded() {
      
    },
  })
  
}



