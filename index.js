"use strict";

var cc = require('./lib/Chromecast')
var re = require('./lib/Registrar')
var co = require('./lib/Controller')

module.exports =  {
  Chromecast: cc.default,
  CastOptions: cc.CastOptions,
  Register: re.default,
  Controller: co.default
}

