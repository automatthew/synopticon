DOMManager = require("./dom_manager")
CSSManager = require("./css_manager")


class Synopticon
  constructor: (@options) ->
    @dom_manager = new DOMManager()
    @css_manager = new CSSManager(2000)
    #@spire = new Spire
      #url: "http://localhost:1337"
    #@spire.login("spireio@mailinator.com", "spire.io.rb")

  inject_spire: (callback) ->
    synopticon = @
    s = document.createElement("script")
    s.src = "/spire.io.bundle.js"
    document.head.appendChild(s)
    s.onload = () =>
      console.log "trying to snarf spire"
      Spire = window.require("./spire.io.js")
      @init_spire(Spire, callback)
      #spire = synopticon.spire = new Spire(url: "http://localhost:1337")
      #spire.login "spireio@mailinator.com", "spire.io.rb", (err, session) ->
        #if !err
          #console.log "spire login worked"
          #callback()


  init_spire: (constructor, callback) ->
    @spire = new constructor(url: "http://localhost:1337")
    @spire.login "spireio@mailinator.com", "spire.io.rb", (err, session) =>
      if !err
        console.log "spire login worked"
        @spire_setup()
        callback()
      else
        console.log(err)

  spire_setup : ->
    Channel = window.require("./spire/api/channel")
    Subscription = window.require("./spire/api/subscription")
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
    @subscription = new Subscription @spire,
      url: accessors.subscription.url
      capabilities:
        messages: accessors.subscription.messages

  spire_accessors: ->
    {
      "subscription": {
        "url": "http://localhost:1337/account/Ac-AwE/subscription/AnonSu-Q2gtQmdF",
        "messages": "rQ0jHMEiBKucOgQIuSHJrQ"
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


  listen: ->
    synopt = @
    console.log("starting Synopticon")
    @inject_spire =>
      @css_manager.listen(@send_css_change)
      @dom_manager.listen(@send_dom_change)

  send_dom_change: (path, data) =>
    # TODO: compress data for transmission via spire
    @dom_manager.apply_change(path, data)

  send_css_change: (patchset) =>
    for patch, i in patchset
      @css_manager.apply_changes(i, patch)

  snapshot: ->
    dom = @dom_manager.snapshot()
    css = @css_manager.snapshot()
    # send to snapshot channel

module.exports = Synopticon
