DOMManager = require("./dom_manager")
CSSManager = require("./css_manager")


class Synopticon
  constructor: (@spire_url, @role, @accessors) ->
    if @role == "master"
      console.log("starting Synopticon as master.")
    else if @role == "slave"
      console.log("starting Synopticon as slave.")
    else
      console.log("unknown role: #{role}")
    @dom_manager = new DOMManager()
    @css_manager = new CSSManager(1000)

  listen: ->
    synopticon = @
    role = synopticon.role

    Spire = window.require("./spire.io.js")
    @spire = new Spire(url: @spire_url)
    @spire.api.discover (err, discovered) ->
      if err
        console.log(err)
      else
        synopticon["listen_#{role}"]()

  listen_master: ->
    Channel = window.require("./spire/api/channel")
    @css_channel = new Channel @spire, @accessors.css
    @dom_channel = new Channel @spire, @accessors.dom
    @snapshot_channel = new Channel @spire, @accessors.snapshot

    @css_manager.listen(@send_css_change)
    @dom_manager.listen(@send_dom_change)

  listen_slave: ->
    synopticon = @
    Subscription = window.require("./spire/api/subscription")
    @subscription = new Subscription @spire, @accessors.subscription
    @subscription.addListener "message", (message) ->
      content = message.content
      channel = message.data.channel_name
      if channel.indexOf(".dom") != -1
        synopticon.dom_manager.apply_change(content.path, content.data)
      else if channel.indexOf(".css") != -1
        for patch, i in content
          synopticon.css_manager.apply_changes(i, patch)
      else
        console.log(channel)
        console.log(message.content)
    @subscription.startListening(last: "now")


  send_dom_change: (path, data) =>
    # TODO: compress data for transmission via spire
    console.log(path, data)
    @dom_channel.publish({path: path, data:data})

  send_css_change: (patchset) =>
    console.log(patchset)
    @css_channel.publish(patchset)

  snapshot: ->
    dom = @dom_manager.snapshot()
    css = @css_manager.snapshot()
    # send to snapshot channel


module.exports = Synopticon
