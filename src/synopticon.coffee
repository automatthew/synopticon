DOMManager = require("./dom_manager")
CSSManager = require("./css_manager")


class Synopticon
  constructor: (@role) ->
    if @role == "master"
      console.log("starting Synopticon as master.")
    else if @role == "slave"
      console.log("starting Synopticon as slave.")
    else
      console.log("unknown role: #{role}")
    @dom_manager = new DOMManager()
    @css_manager = new CSSManager(2000)

  listen: ->
    synopticon = @
    role = synopticon.role
    @inject_spire =>
      synopticon["listen_#{role}"]()

  inject_spire: (callback) ->
    synopticon = @
    s = document.createElement("script")
    s.src = "http://localhost:8000/spire.io.bundle.js"
    document.head.appendChild(s)
    s.addEventListener "load", =>
      Spire = window.require("./spire.io.js")
      @spire = new Spire(url: "http://localhost:1337")
      @spire.login "spireio@mailinator.com", "spire.io.rb", (err, session) =>
        if !err
          console.log "spire login worked"
          callback()
        else
          console.log(err)


  listen_master: ->
    Channel = window.require("./spire/api/channel")
    accessors = @spire_accessors()
    @css_channel = new Channel @spire,
      url: accessors.css.url
      capabilities:
        publish: accessors.css.publish
    @dom_channel = new Channel @spire,
      url: accessors.dom.url
      capabilities:
        publish: accessors.dom.publish
    @snapshot_channel = new Channel @spire,
      url: accessors.snapshot.url
      capabilities:
        publish: accessors.snapshot.publish

    @css_manager.listen(@send_css_change)
    @dom_manager.listen(@send_dom_change)

  listen_slave: ->
    synopticon = @
    Subscription = window.require("./spire/api/subscription")
    accessors = @spire_accessors()
    @subscription = new Subscription @spire,
      url: accessors.subscription.url
      capabilities:
        events: accessors.subscription.events
    @subscription.addListener "message", (message) ->
      content = message.content
      channel = message.data.channel_name
      #console.log(content)
      if channel == "dom"
        synopticon.dom_manager.apply_change(content.path, content.data)
      else if channel == "css"
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

  spire_accessors: ->
    {
      "subscription": {
        "url": "http://localhost:1337/account/Ac-AwE/subscription/AnonSu-Q2gtQlFFLENoLUJnRSxDaC1JQUU",
        "events": "yMKA8es2pWROb29kig3WCxw"
      },
      "css": {
        "publish": "MDmKOB7NmXcNiChWD08iJw",
        "url": "http://localhost:1337/account/Ac-AwE/channel/Ch-IAE"
      },
      "dom": {
        "publish": "KwFjC5msfCfp7FK210HxWw",
        "url": "http://localhost:1337/account/Ac-AwE/channel/Ch-BgE"
      },
      "snapshot": {
        "publish": "bzf4bJH68ifSHgPjAMnUUg",
        "url": "http://localhost:1337/account/Ac-AwE/channel/Ch-BQE"
      }
    }



module.exports = Synopticon
