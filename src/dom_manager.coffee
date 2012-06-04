
class DOMManager
  constructor: ->

  listen: (callback) ->
    document.addEventListener(
      "DOMSubtreeModified", @create_listener(callback)
    )

  create_listener: (callback) ->
    manager = @
    (event) ->
      if !manager.ignore
        element = event.target
        if element.constructor == Text
          element = element.parentElement
        path = manager.xpath(element)
        callback(path, element.outerHTML)

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
      #found.outerHTML = data
    else
      console.log("Couldn't find DOM element:")
      console.log(path, data)
    @ignore = false

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

module.exports = DOMManager

