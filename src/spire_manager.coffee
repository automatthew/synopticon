Spire = window.require("./spire.io.js")
Channel = window.require("./spire/api/channel")

class SpireManager
  constructor: (@spire_url, @accessors) ->
    @spire = new Spire(url: @spire_url)
    @channels = {}

  start: (callback) ->
    manager = @
    @spire.api.discover (err, discovered) ->
      if err
        console.log(err)
      else
        manager.setup_publishers()
        manager.setup_listeners()
        callback()

  listen: (callback) ->
    @subscription.addListener "message", callback
    @subscription.startListening(last: "now")

  publish: (name, data) ->
    channel = @channels[name]
    if channel
      channel.publish(data)
    else
      throw "No such channel: #{name}"

  setup_publishers: ->
    console.log("creating channels")
    @css_channel = new Channel @spire, @accessors.css
    @dom_channel = new Channel @spire, @accessors.dom
    @channels["dom"] = @dom_channel
    @channels["css"] = @css_channel
    @snapshot_channel = new Channel @spire, @accessors.snapshot

  setup_listeners: ->
    console.log("creating subscription")
    Subscription = window.require("./spire/api/subscription")
    @subscription = new Subscription @spire, @accessors.subscription


module.exports = SpireManager
