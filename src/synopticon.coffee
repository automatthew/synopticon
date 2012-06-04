DOMManager = require("./dom_manager")
CSSManager = require("./css_manager")

class Synopticon
  constructor: (@name) ->
    @dom_manager = new DOMManager()
    @css_manager = new CSSManager(3000)

  listen: ->
    console.log("starting Synopticon")
    @dom_manager.listen(@send_dom_change)
    @css_manager.listen(@send_css_change)

  snapshot: ->
    dom = @dom_manager.snapshot()
    css = @css_manager.snapshot()
    # send to snapshot channel
    

  local_dom_listener: (ev) =>
    #console.log(ev)
    element = ev.target
    if element.constructor == Text
      element = element.parentElement
    path = @xpath(element)
    @send_dom_change(path, element.outerHTML)

  send_dom_change: (path, data) =>
    # TODO: compress data for transmission via spire
    console.log(path, data.length)

  send_css_change: (patchset) =>
    for href, patch of patchset
      for hunk in patch
        console.log(href, hunk.file2.chunk)


module.exports = Synopticon
