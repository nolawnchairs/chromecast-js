# Chromecast Sender API

This is an abstraction wrapper around Google's Cast Sender API for Chrome. Google's [documentation](https://developers.google.com/cast/docs/developers) for the Chrome API is pretty shitty. Sure, all the massive JS doc is there, but a lot of aspects of using it are not covered in the Guides section... it pretty much tells you how to connect and load media, and how to do more advanced things like subtitles, but it lacks any clues on how to implement queuing and event handling. Google also doesn't offer the code on NPM, so there's that.

I started this project because I manage two video-based web applications that I wanted to  use the cast API for, and I figured a few people may find it useful. 

Since this is more or less an *abstraction* around Google's native Cast Sender API. As an abstraction, most aspects have been vastly over-simplified. This library lacks (as of now) some of the functionality, but it should be sufficient for most use cases.

This library is written in [TypeScript](https://www.typescriptlang.org/), with TypeScript in mind.

## Install
Install via NPM
`npm i @nolawnchairs/chromecast`

Or Yarn...
`yarn add @nolawnchairs/chromecast`

## Getting Started
The package contains the following modules:

**Chromecast** - The base singleton class that manages the connection, media and queuing
**Options** - Sets the options for the cast framework
**Controller** - Controls the media playback
**Register** - Registering for events

`import { Chromecast, Options, Controller, Register } from '@nolawnchairs/chromecast`

___
**Quick Setup**
All options are optional, however you must provide a valid `receiverId` in order to test on your Chromecast device.  Under the hood, this adds Google's javascript file to your document body, and fires the `readyStateListener` once the dependencies have loaded.
```
// Define options
const options = {
  receiverApplicationId: receiverId,
  autoJoinPolicy: Chromecast.AutoJoinPolicy.ORIGIN_SCOPED
}

// Initialize chromecast service
Chromecast.initializeCastService(options).catch(console.error)
Chromecast.setReadyStateListner(() =>  {
	// Add your logic here. Anything that uses the cast
	// service must be called after the service is ready
})
```
You will also need to add Google's web component to your DOM. This creates the cast icon that triggers the connection with Chrome.
```
<google-cast-launcher id="castbutton"></google-cast-launcher>
```
___
### Playing Media
There are two methods of playing media - as a single-play, and as a queue:

**Single Play**
```
// First, create a Media entity
const media = Chromecast.newMediaEntity(myVideoUrl, 'video/mp4')

// Then play it
Chromecast.playOne(media)
```
Simple, eh? Queuing is much better, though...

**Queuing**
```
// Create Media entities. Here, we'll assume that all the values
// are stored as an array
const media = [...]
const queue = media.map(m => {
	return Chromecast.newMediaEntity(m.url, m.mime, m.title, m.image)
})

// Add these items to the queue
Chromecast.queueItems(queue)

// Start the queue
Chromecast.startQueue()

// Skip to the next item in the queue
Chromecast.playNext()

// Go back to the previous video in the queue
Chromecast.playPrevious()

// Restart the current item
Chromecast.restartCurrent()

// Stop current playback and disconnect from the cast service
Chromecast.disconnect()
```
___
### Media Control
We want our users to be able to control aspects of playback
```
// Toggle play
Controller.togglePlay()

// Toggle Mute
Controller.toggleMute()

// Seeking is easy, there are three ways,
// Seek forward or back by a certain number of seconds
Controller.seek(30)
Controller.seek(-10)

// Seek to a certain time (in seconds)
Controller.seekToTime(187) // 3 minutes, 7 seconds

// Seek to a percentage of the video (as a float between 0 and 1)
Controller.seekToPercentage(0.5) // 50%

// Adjust volume (as a float between 0 and 1)
Controller.adjustVolume(0.5) // 50% volume

// Stop playback
Controller.stop()
```
___
### Observing Events
There are different ways to observe events, depending on your coding paradigm

**Functional**
For our functional programming friends, you can subscribe to events much like the NodeJS way:
```
// Listen for the 'currentTime' event, which tells us playback 
// progress in seconds
Chromecast.on('currentTime', seconds => doSomething(seconds))

// To remove listeners, we just need the name
Chromecast.off('currentTime')
```
We can also listen to all events by registering. All `Register` methods return an unregister function that can be called when we're done listening
```
// Register for all events
const unregisterHook = Register.forEvents(myEventHandler)
function eventHandler(eventName, eventData) {
	console.log(eventName, eventData)
	switch (eventName) {
		case 'currentTime':
			doSomethingWithTime(eventData)
			break
	}
}

// unregister all events
unregisterHook()
```
**Object Oriented**
This is for the TypeScript people who prefer to create a class with an implemented interface.  These, for the most part are the same listeners as above, but are aliased as interface methods
```
import { Listeners, Register } from '@nolawnchairs/chromecast'
import Store from './MyStore'

class PlaybackHandler implements Listeners.PlaybackEvent {
  // Fired when 'currentTime' is emitted
  onTimeUpdate(time:  number) {
	  Store.setPlaybackTime(time)
  }
  // Fired when media is paused
  onPaused() {
    Store.setPlaybackPaused()
  }
  ...
}

// Register
const unregister = Register.forPlaybackEvents(new PlaybackHandler())

// Unregister
unregister()
```
Of course, this way, you must implement all methods in the interface contract.