Diff = require("./diff")
CSSPatcher = require "./css_patcher"

class CSSManager
  constructor: (@interval) ->
    @last = @process_stylesheets()

  snapshot: ->

  listen: (callback) ->
    setInterval(@create_listener(callback), @interval)

  find_stylesheet_by_href: (href) ->


  create_listener: (callback) ->
    manager = @
    () ->
      current = manager.process_stylesheets()
      diffs = []
      for new_rules, i in current
        old_rules = manager.last[i]
        if old_rules
          d = Diff.diff_patch(old_rules, new_rules)
          diffs.push(d)
        else
          diffs.push([])
          console.log("couldn't find rules")
      manager.last = current
      callback(diffs) if Object.keys(diffs).length > 0

  process_stylesheets: ->
    sheets = []
    for sheet in document.styleSheets
      sheets.push(@process_sheet(sheet))
    sheets

  process_sheet: (sheet) ->
    if sheet.href and sheet.rules
      rule.cssText for rule in sheet.rules
    else
      []

  apply_changes: (index, data) ->
    stylesheet = document.styleSheets[index]

    patcher = new CSSPatcher(stylesheet)
    patcher.apply_patch(data)


module.exports = CSSManager
