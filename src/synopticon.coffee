Diff = require("./diff")
DOMManager = require("./dom_manager")
CSSManager = require("./css_manager")

class Synopticon
  constructor: (@name) ->
    @css_manager = new CSSManager(3000)

  go: -> @listen()

  listen: ->
    console.log("starting synopticon")
    document.body.addEventListener "DOMSubtreeModified", @local_dom_listener
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

  send_dom_change: (path, data) ->
    # TODO: compress data for transmission via spire
    console.log(path, data.length)

  send_css_change: (patchset) =>
    for href, patch of patchset
      for hunk in patch
        console.log(href, hunk.file2.chunk)

  remote_listener: (data) =>
    data

  apply_dom_change: (path, data) ->
    # TODO:  consider checking some variable instead of removing
    # and readding the local_dom_listener
    document.body.removeEventListener("DOMSubtreeModified", @local_dom_listener)

    iter = document.evaluate(
      path, document, null,
      # TODO: figure out actually useful options
      XPathResult.ANY_TYPE, null
    )
    found = iter.iterateNext()
    if found
      console.log(found)
      found.outerHTML = data
    else
      console.log("Something went wrong")
      console.log(path, data)
    document.body.addEventListener "DOMSubtreeModified", @local_dom_listener


  xpath: (element) ->
    if element.id != ""
      return "id(\"#{element.id}\")"
    else if element == document.body
      return "//#{element.tagName}"
    else
      ix = 0
      siblings=element.parentNode.childNodes
      for sibling in siblings
        if sibling == element
          return @xpath(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']'
        if sibling.nodeType == 1 && sibling.tagName == element.tagName
          ix++



module.exports = Synopticon
