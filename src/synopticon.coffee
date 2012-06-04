DOMManager = require("./dom_manager")
CSSManager = require("./css_manager")

class Synopticon
  constructor: (@name) ->
    @dom_manager = new DOMManager()
    @css_manager = new CSSManager(2000)

  listen: ->
    console.log("starting Synopticon")
    @dom_manager.listen(@send_dom_change)
    @css_manager.listen(@send_css_change)

  send_dom_change: (path, data) =>
    # TODO: compress data for transmission via spire
    @dom_manager.apply_change(path, data)

  send_css_change: (patchset) =>
    for href, patch of patchset
      @css_manager.apply_changes(href, patch)

  snapshot: ->
    dom = @dom_manager.snapshot()
    css = @css_manager.snapshot()
    # send to snapshot channel

module.exports = Synopticon
