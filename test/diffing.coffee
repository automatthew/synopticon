Diff = require "../src/diff"

string1= """
That age is best which is the first,
When youth and blood are warmer;
But being spent, the worse, and worst
Times still succeed the former.
Then be not coy, but use your time,
And while ye may, go marry:
For having lost but once your prime,
You may for ever tarry.
"""

string2= """
But being spent, the worse, and worst
Times will succeed the former.

Then be not coy, but use your time,
And while you may, go marry:
For having lost but once your prime,
You may for ever tarry.
ALONE!
"""

doc1 = string1.split("\n")
doc2 = string2.split("\n")

patch = Diff.diff_patch(doc1, doc2)

insert = (list, index, elements) ->
  args = [index, 0].concat(elements)
  console.log(args)
  Array.prototype.splice.apply(list, args)

remove = (list, index, count) ->
  console.log([index, count])
  list.splice(index, count)

change = (list, index, count, elements) ->
  foo

`
var apply_patch = function apply_patch(list, patch) {
  for (i=patch.length; i>0; i--) {
    var hunk = patch[i-1];
    apply_hunk(list, hunk)
  }
}
`


apply_hunk = (list, hunk) ->
  offset = hunk.file1.offset
  if hunk.file1.length == 0
    insert(list, offset, hunk.file2.chunk)
  else if hunk.file2.length == 0
    remove(list, offset, hunk.file1.length)
  else
    remove(list, offset, hunk.file1.length)
    insert(list, offset, hunk.file2.chunk)

result = Array.prototype.slice.call(doc1)

apply_patch(result, patch)
console.log(result)
