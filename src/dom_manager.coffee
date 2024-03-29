
class DOMManager
  constructor: ->
    @ignore = false

  snapshot: ->
    head = document.head.cloneNode(true)
    body = document.body.cloneNode(true)
    for link in head.getElementsByTagName("link")
      link.href = "data:text/css;base64,"

    for image in body.getElementsByTagName("img")
      # make sure all the images have fully qualified src
      image.src = image.src.toString()

    head: head.innerHTML
    body: body.innerHTML

  clobber: ->
    manager = @
    @saved_head = document.head.cloneNode(true)
    @saved_body = document.body.cloneNode(true)
    document.head.innerHTML = """
      <title>Synopticated!</title>
      <style>
        body {
          margin: 0px;
        }
        div#synopticon-control {
          margin: 0px;
          padding-top: 5px;
          padding-bottom: 5px;
          width: 100%;
          background: #ddf;
          border-bottom: 3px solid white;
        }

        div#synopticon-control span {
          font-weight: bold;
          margin-left: 1em;
          margin-right: 4em;
        }
        a#synopticon-restore {
        }
      </style>
    """
    document.body.innerHTML = """
      <div id="synopticon-control">
        <span>Synopticating!</span>
        <a id="synopticon-restore" href="">Restore original</a>
      </div>
      <iframe id="synopticated" frameborder="0"
        marginheight="0" marginwidth="0"
        width="100%" height="100%" ></iframe>
    """
    @init_iframe()
    restore_link = document.getElementById("synopticon-restore")
    restore_link.addEventListener "click", (event) ->
      event.preventDefault()
      manager.restore()

  init_iframe: ->
    manager = @
    @iframe = document.getElementById("synopticated")
    @iframe.contentDocument.head.innerHTML = """
      <style>
        @-webkit-keyframes throb {
          0%   {
            opacity: 0.8;
            margin-top: 5px;
          }
          40%  {
            opacity: 0.4;
            margin-top: 10px;
          }
          100% {
            opacity: 0.8;
            margin-top: 5px;
          }
        }
        h2 {
          text-align: center;
          -webkit-animation-name: throb;
          -webkit-animation-duration: 1.5s;
          -webkit-animation-iteration-count: infinite;
        }

      </style>
    """
    @iframe.contentDocument.body.innerHTML = """
      <h2>Waiting for snapshot from master</h2>
    """

  apply_snapshot: (data) ->
    @iframe.contentDocument.head.innerHTML = data.head
    @iframe.contentDocument.body.innerHTML = data.body

  restore: ->
    document.head.innerHTML = @saved_head.innerHTML
    document.body.innerHTML = @saved_body.innerHTML

  on_change: (callback) ->
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

    iter = @iframe.contentDocument.evaluate(
      path, @iframe.contentDocument, null,
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


module.exports = DOMManager

