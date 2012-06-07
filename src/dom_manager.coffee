
class DOMManager
  constructor: ->
    @ignore = false

  listen: (callback) ->
    document.addEventListener("DOMSubtreeModified", @create_listener(callback))

  create_listener: (callback) ->
    manager = @
    (event) ->
      if manager.usable_event(event)
        element = event.target
        if element.constructor == Text
          element = element.parentElement
        path = manager.xpath(element)
        callback(path, element.outerHTML)

  usable_event: (event) ->
    @ignore == false

  xpath: (element) ->
    if element.id != ""
      return "id(\"#{element.id}\")"
    else if (element == document.body) || (element == document.head)
      return "//#{element.tagName}"
    else
      ix = 0
      siblings=element.parentNode.childNodes
      for sibling in siblings
        if sibling == element
          return @xpath(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']'
        if sibling.nodeType == 1 && sibling.tagName == element.tagName
          ix++

  apply_change: (path, data) ->
    @ignore = true

    iter = document.evaluate(
      path, document, null,
      # TODO: figure out actually useful options
      XPathResult.ANY_TYPE, null
    )
    found = iter.iterateNext()
    if found
      console.log("DOM change:", path, data)
      found.outerHTML = data
    else
      console.log("Couldn't find DOM element:")
      console.log(path, data)
    @ignore = false


  class Snapshotter
    constructor: ->
      @saved_head = document.head.cloneNode(true)
      @bootstrap_styles()

    bootstrap_styles: ->
      stylesheets = (sheet for sheet in document.styleSheets)
      head = document.createElement("head")
      rulesets = []
      for stylesheet, index in stylesheets
        if stylesheet.href
          rules = (rule.cssText for rule in stylesheet.rules)
          rulesets.push(rules)
          link_node = stylesheet.ownerNode
          document.head.removeChild(link_node)

          new_link = @empty_link()
          head.appendChild(new_link)
          new_link.setAttribute("orig_href", stylesheet.href)
      document.head.innerHTML = head.innerHTML

      for rules, i in rulesets
        stylesheet = document.styleSheets[i]
        for rule, j in rules
          stylesheet.insertRule(rule, j)

    empty_link: ->
      link = document.createElement("link")
      link.type = "text/css"
      link.rel = "stylesheet"
      link.href = "data:text/css;base64,"
      link

    find_stylesheet: (href) ->
      for sheet in document.styleSheets when sheet.href
        console.log "found", sheet.href
        if sheet.href.indexOf(href) != -1
          return sheet

    snapshot: ->
      head: document.head.innerHTML
      body: document.body.innerHTML

    stylesheet_links:  ->
      links = document.getElementsByTagName("link")
      for link in links when link.getAttribute("rel") == "stylesheet"
        console.log(link)


module.exports = DOMManager

