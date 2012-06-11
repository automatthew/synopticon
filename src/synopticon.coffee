DOMManager = require("./dom_manager")
CSSManager = require("./css_manager")
SpireManager = require("./spire_manager")

class Synopticon
  constructor: (@spire_url, @role, @accessors) ->
    if @role == "master"
      console.log("starting Synopticon as master.", @spire_url)
    else if @role == "slave"
      console.log("starting Synopticon as slave.", @spire_url)
    else
      console.log("unknown role: #{role}")
    @spire_manager = new SpireManager(@spire_url, @accessors)
    @dom_manager = new DOMManager()
    @css_manager = new CSSManager(1000)

  listen: ->
    synopticon = @
    role = synopticon.role
    @spire_manager.start ->
      synopticon["start_#{role}"]()


  start_master: ->
    @spire_manager.publish "snapshot",
      dom: @dom_manager.snapshot()
      css: @css_manager.snapshot()
    @css_manager.on_change(@send_css_change)
    @dom_manager.on_change(@send_dom_change)

  start_slave: ->
    synopticon = @
    @dom_manager.clobber()
    @spire_manager.listen (message) ->
      content = message.content
      channel = message.data.channel_name
      if channel.indexOf(".dom") != -1
        synopticon.dom_manager.apply_change(content.path, content.data)
      else if channel.indexOf(".css") != -1
        synopticon.css_manager.patch(content)
      else if channel.indexOf(".snapshot") != -1
        synopticon.dom_manager.apply_snapshot(message.content.dom)
        synopticon.css_manager.apply_snapshot(message.content.css)
      else
        console.log(channel)
        console.log(message.content)

  send_dom_change: (path, data) =>
    @spire_manager.publish("dom", {path: path, data: data})
    # TODO: compress data for transmission via spire

  send_css_change: (patchset) =>
    # TODO: remove unnecessary info from patchset
    console.log(patchset)
    @spire_manager.publish("css", patchset)

  snapshot: ->
    dom = @dom_manager.snapshot()
    css = @css_manager.snapshot()
    # send to snapshot channel


module.exports = Synopticon
