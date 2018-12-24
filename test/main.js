"use strict";

const { Chromecast, Register, Controller } = require('..')


const toggle = document.getElementById('pp')
toggle.addEventListener('click', () => Controller.togglePlay())

const stop = document.getElementById('stop')
stop.addEventListener('click', () => {
  Controller.stop()
  Chromecast.disconnect()
})

const qb = document.getElementById('qb')
qb.addEventListener('click', () => {
  const e = createEntity('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'For Bigger Blazes', 'https://payloads.enaturelive.com/posters/2D19CDAC641B3437/T-8403CE489DB831A4.jpg')
  Chromecast.addToQueue(e)
})

const skip = document.getElementById('skip')
skip.addEventListener('click', () => Chromecast.playNext())

const seek = document.getElementById('seek')
seek.addEventListener('click', () => Controller.seekToPercentage(.98))

const options = {
  receiverApplicationId: '87F34079',
  autoJoinPolicy: 'origin_scoped'
}

const videoQueue = [
  createEntity('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Big Buck Bunny', 'https://payloads.enaturelive.com/posters/0EE08B6A217E0ADC/T-3B709EC02A1BEE9A.JPG'),
  createEntity('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', "Elephant's Dream", 'https://payloads.enaturelive.com/posters/EA7A70A934B8539B/T-2B5081B5E19F2471.jpg')
]

Chromecast.initializeCastService(options)
  .catch(console.error)
Chromecast.setReadyStateListner(() => onReady())

function createEntity(url, title, image) {
  const item = Chromecast.newMediaEntity(url, 'video/mp4', title, image)
  videoQueue.push(item)
  return item
}

function onReady() {
  Chromecast.queueItems(videoQueue)
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
  Register.forQueueEvent({
    onLoaded() {
      console.log('q loaded')
    },
    onStarted() {
      console.log('q started')
    },
    onStopped() {
      console.log('q stopped')
    },
    onUpdate() {
      console.log('q changed')
    },
    onItemChange() {
      console.log('q item changed')
    },
  })
}



