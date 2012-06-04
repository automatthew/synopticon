Diff = require("./diff")
CSSPatcher = require("./css_patcher")

class Synopticon
  constructor: (@name) ->
    @name
    @last = @process_stylesheets()

  go: -> @listen()

  listen: ->
    console.log("starting synopticon")
    document.body.addEventListener "DOMSubtreeModified", @local_dom_listener
    #setInterval @local_css_listener, 2000

  snapshot: ->
    dom = @snapshot_dom()
    css = @snapshot_css()
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

  local_css_listener: () =>
    console.log("checking css")
    current = @process_stylesheets()
    diffs = {}
    for href, new_rules of current
      old_rules = @last[href] # TODO: handle missing old
      diffs[href] = Diff.diff_patch(old_rules, new_rules)
      console.log(diffs[href][0].file2.chunk) if diffs[href].length > 0
    @last = current
    diffs

  process_stylesheets: ->
    sheets = {}
    for sheet in document.styleSheets
      sheets[sheet.href] = @process_sheet(sheet)
    sheets

  process_sheet: (sheet) ->
    if sheet.rules
      rule.cssText for rule in sheet.rules
    else
      []

module.exports = Synopticon
