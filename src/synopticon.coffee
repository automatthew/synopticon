console.log("loading synopticon")

class Synopticon
  constructor: (@name) ->
    @name

  go: ->
    sheets = window.document.styleSheets
    @last = {}
    for sheet in sheets
      @last[sheet.href] = @process_sheet(sheet)
    document.body.addEventListener "DOMSubtreeModified", @listener

  listener: (ev) =>
    document.body.removeEventListener("DOMSubtreeModified", @listener)
    element = ev.srcElement
    if element.constructor == Text
      element = element.parentElement
    path = @xpath(element)
    #console.log(path)
    found = document.evaluate(path, document, null,
      XPathResult.ANY_TYPE, null).iterateNext()
    console.log(found)
    document.body.addEventListener "DOMSubtreeModified", @listener

  process_sheet: (sheet) ->
    text_rules = []
    rules = sheet.rules
    if rules
      for rule in rules
        text_rules.push(rule.cssText)
    text_rules

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


class DOMChange
  constructor: (@element) ->


module.exports = Synopticon
