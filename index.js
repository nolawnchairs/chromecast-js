"use strict";

var cc = require('./lib/Chromecast')
var co = require('./lib/Controller')

module.exports =  {
  Chromecast: cc.default,
  CastOptions: cc.CastOptions,
  Controller: co.default
}

