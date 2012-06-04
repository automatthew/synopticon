Patcher = require "./patcher"
class CSSPatcher extends Patcher

  insert: (index, rules) ->
    for rule, i in rules
      console.log "Modify #{@patchee.href} insertRule('#{rule}', #{index+i})"
      #@patchee.insertRule(rule, index+i)

  remove: (index, count) ->
    for i in [0..count-1]
      console.log "Modify #{@patchee.href} deleteRule(#{index})"
      #@patchee.deleteRule(index)

module.exports = CSSPatcher

