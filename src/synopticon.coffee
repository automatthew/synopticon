Diff = require("./diff")

class Synopticon
  constructor: (@name) ->
    @name
    @last = @process_stylesheets()

  go: ->
    document.body.addEventListener "DOMSubtreeModified", @local_dom_listener
    setInterval @local_css_listener, 2000

  local_dom_listener: (ev) =>
    console.log(ev)
    element = ev.target
    if element.constructor == Text
      element = element.parentElement
    path = @xpath(element)
    console.log(element)

  send_dom_change: (path, data) ->


  remote_listener: (data) =>
    data

  apply_dom_change: (path, data) ->
    # TODO:  consider checking some variable instead of removing
    # and readding the local_dom_listener
    document.body.removeEventListener("DOMSubtreeModified", @local_dom_listener)

    iter = document.evaluate(
      path, document, null,
      XPathResult.ANY_TYPE, null
    )
    found = iter.iterateNext()
    console.log(found)
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
