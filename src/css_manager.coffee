Diff = require("./diff")
CSSPatcher = require "./css_patcher"

class CSSManager
  constructor: (@interval) ->
    @current = @previous = @snapshot()

  on_change: (callback) ->
    setInterval(@create_listener(callback), @interval)

  create_listener: (callback) ->
    manager = @
    () ->
      patches = manager.diff()
      manager.previous = manager.current
      worthy =  patches.some (diff) -> diff.length > 0
      if worthy
        callback(patches)

  diff: ->
    manager = @
    manager.current = manager.snapshot()
    patches = []
    for new_rules, i in manager.current
      old_rules = manager.previous[i]
      if old_rules
        d = Diff.diff_patch(old_rules, new_rules)
        patches.push(d)
      else
        patches.push([])
        console.log("couldn't find rules")
    patches


  snapshot: ->
    (@process_sheet(sheet) for sheet in document.styleSheets)

  process_sheet: (sheet) ->
    if sheet.rules
      rule.cssText for rule in sheet.rules
    else
      []

  apply_snapshot: (data) ->
    @iframe ||= document.getElementById("synopticated")
    for rules, index in data
      stylesheet = @iframe.contentDocument.styleSheets[index]
      if stylesheet.href
        for rule, i in rules
          stylesheet.insertRule(rule, i)



  patch: (data) ->
    for patch, index in data
      stylesheet = @iframe.contentDocument.styleSheets[index]
      patcher = new CSSPatcher(stylesheet)
      patcher.apply_patch(patch)


module.exports = CSSManager
