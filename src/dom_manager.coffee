
class DOMManager
  constructor: ->

  listen: (callback) ->
    document.body.addEventListener(
      "DOMSubtreeModified", @create_listener(callback)
    )

  create_listener: (callback) ->
    manager = @
    (event) ->
      element = event.target
      if element.constructor == Text
        element = element.parentElement
      path = manager.xpath(element)
      callback(path, element.outerHTML)

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

module.exports = DOMManager

