Diff = require("./diff")
CSSPatcher = require "./css_patcher"

class CSSManager
  constructor: (@interval) ->
    @last = @process_stylesheets()

  listen: (callback) ->
    setInterval(@create_listener(callback), @interval)

  create_listener: (callback) ->
    manager = @
    () ->
      current = manager.process_stylesheets()
      diffs = {}
      for href, new_rules of current
        if href != "null"
          old_rules = manager.last[href] # TODO: handle missing old
          if old_rules
            d = Diff.diff_patch(old_rules, new_rules)
            diffs[href] = d if d.length > 0
          else
            console.log("couldn't find rules")
        else
          console.log("null href (probably inline style tag)"
      manager.last = current
      callback(diffs) if Object.keys(diffs).length > 0

  process_stylesheets: ->
    sheets = {}
    for sheet in document.styleSheets
      sheets[sheet.href] = @process_sheet(sheet)
    sheets

  process_sheet: (sheet) ->
    if sheet.rules
      rule.cssText for rule in sheet.rules
    else
      console.log(sheet.ownerNode)
      []

  apply_changes: (identifier, data) ->
    hrefs = (sheet.href for sheet in document.styleSheets)
    index = hrefs.indexOf(identifier)
    if index != -1
      style_sheet = document.styleSheets[index]
    else
      console.log "Something is wrong"
      return

    patcher = new CSSPatcher(style_sheet)
    patcher.apply_patch(data)
    # * find the correct stylesheet
    # * use the patch to find adds and deletes
    # * set @last to current stylesheets, so we don't propagate
    #   the changes we just received.


module.exports = CSSManager
