# Use with patches from diff.js
class Patcher

  constructor: (@patchee) ->

  `
  Patcher.prototype.apply_patch = function apply_patch(patch) {
    for (i=patch.length; i>0; i--) {
      var hunk = patch[i-1];
      apply_hunk(this.patchee, hunk)
    }
  }
  `

  apply_hunk: (hunk) ->
    offset = hunk.file1.offset
    if hunk.file1.length == 0
      insert(@patchee, offset, hunk.file2.chunk)
    else if hunk.file2.length == 0
      remove(@patchee, offset, hunk.file1.length)
    else
      remove(@patchee, offset, hunk.file1.length)
      insert(@patchee, offset, hunk.file2.chunk)

  # class specific methods.  These are for arrays.
  insert: (index, elements) ->
    args = [index, 0].concat(elements)
    console.log(args)
    Array.prototype.splice.apply(@patchee, args)

  remove: (index, count) ->
    console.log([index, count])
    @patchee.splice(index, count)


module.exports = Patcher

