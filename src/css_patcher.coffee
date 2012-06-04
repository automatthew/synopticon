Patcher = require "./patcher"
class CSSPatcher extends Patcher

  insert: (index, rules) ->
    for rule, i in rules
      @patchee.insertRule(rule, index+i)

  remove: (index, count) ->
    for i in [0..count-1]
      @patchee.deleteRule(index)

module.exports = CSSPatcher

