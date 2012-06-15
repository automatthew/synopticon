require.define("/css_manager.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var CSSManager, CSSPatcher, Diff;

  Diff = require("./diff");

  CSSPatcher = require("./css_patcher");

  CSSManager = (function() {

    function CSSManager(interval) {
      this.interval = interval;
      this.current = this.previous = this.snapshot();
    }

    CSSManager.prototype.on_change = function(callback) {
      return setInterval(this.create_listener(callback), this.interval);
    };

    CSSManager.prototype.create_listener = function(callback) {
      var manager;
      manager = this;
      return function() {
        var patches, worthy;
        patches = manager.diff();
        manager.previous = manager.current;
        worthy = patches.some(function(diff) {
          return diff.length > 0;
        });
        if (worthy) {
          return callback(patches);
        }
      };
    };

    CSSManager.prototype.diff = function() {
      var d, i, manager, new_rules, old_rules, patches, _i, _len, _ref;
      manager = this;
      manager.current = manager.snapshot();
      patches = [];
      _ref = manager.current;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        new_rules = _ref[i];
        old_rules = manager.previous[i];
        if (old_rules) {
          d = Diff.diff_patch(old_rules, new_rules);
          patches.push(d);
        } else {
          patches.push([]);
          console.log("couldn't find rules");
        }
      }
      return patches;
    };

    CSSManager.prototype.snapshot = function() {
      var sheet, _i, _len, _ref, _results;
      _ref = document.styleSheets;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sheet = _ref[_i];
        _results.push(this.process_sheet(sheet));
      }
      return _results;
    };

    CSSManager.prototype.process_sheet = function(sheet) {
      var rule, _i, _len, _ref, _results;
      if (sheet.rules) {
        _ref = sheet.rules;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          rule = _ref[_i];
          _results.push(rule.cssText);
        }
        return _results;
      } else {
        return [];
      }
    };

    CSSManager.prototype.apply_snapshot = function(data) {
      var i, index, rule, rules, stylesheet, _i, _len, _results;
      this.iframe || (this.iframe = document.getElementById("synopticated"));
      _results = [];
      for (index = _i = 0, _len = data.length; _i < _len; index = ++_i) {
        rules = data[index];
        stylesheet = this.iframe.contentDocument.styleSheets[index];
        if (stylesheet.href) {
          _results.push((function() {
            var _j, _len1, _results1;
            _results1 = [];
            for (i = _j = 0, _len1 = rules.length; _j < _len1; i = ++_j) {
              rule = rules[i];
              _results1.push(stylesheet.insertRule(rule, i));
            }
            return _results1;
          })());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    CSSManager.prototype.patch = function(data) {
      var index, patch, patcher, stylesheet, _i, _len, _results;
      _results = [];
      for (index = _i = 0, _len = data.length; _i < _len; index = ++_i) {
        patch = data[index];
        stylesheet = this.iframe.contentDocument.styleSheets[index];
        patcher = new CSSPatcher(stylesheet);
        _results.push(patcher.apply_patch(patch));
      }
      return _results;
    };

    return CSSManager;

  })();

  module.exports = CSSManager;

}).call(this);

});

require.define("/diff.js", function (require, module, exports, __dirname, __filename) {
/* Copyright (c) 2006, 2008 Tony Garnock-Jones <tonyg@lshift.net>
 * Copyright (c) 2006, 2008 LShift Ltd. <query@lshift.net>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

module.exports = Diff = {
    longest_common_subsequence: function(file1, file2, postprocessor) {
	/* Text diff algorithm following Hunt and McIlroy 1976.
         * J. W. Hunt and M. D. McIlroy, An algorithm for differential file
         * comparison, Bell Telephone Laboratories CSTR #41 (1976)
         * http://www.cs.dartmouth.edu/~doug/
         *
         * Expects two arrays of strings.
         */

	var equivalenceClasses = {};
	for (var j = 0; j < file2.length; j++) {
	    var line = file2[j];
	    if (equivalenceClasses[line]) {
		equivalenceClasses[line].push(j);
	    } else {
		equivalenceClasses[line] = [j];
	    }
	}

	var candidates = [{file1index: -1,
			   file2index: -1,
			   chain: null}];

	for (var i = 0; i < file1.length; i++) {
	    var line = file1[i];
	    var file2indices = equivalenceClasses[line] || [];

	    var r = 0;
	    var c = candidates[0];

	    for (var jX = 0; jX < file2indices.length; jX++) {
		var j = file2indices[jX];

		for (var s = 0; s < candidates.length; s++) {
		    if ((candidates[s].file2index < j) &&
			((s == candidates.length - 1) ||
			 (candidates[s + 1].file2index > j)))
			break;
		}

		if (s < candidates.length) {
		    var newCandidate = {file1index: i,
					file2index: j,
					chain: candidates[s]};
		    if (r == candidates.length) {
			candidates.push(c);
		    } else {
			candidates[r] = c;
		    }
		    r = s + 1;
		    c = newCandidate;
		    if (r == candidates.length) {
			break; // no point in examining further (j)s
		    }
		}
	    }

	    candidates[r] = c;
	}

	// At this point, we know the LCS: it's in the reverse of the
	// linked-list through .chain of
	// candidates[candidates.length - 1].

	return candidates[candidates.length - 1];
    },

    diff_comm: function(file1, file2) {
	// We apply the LCS to build a "comm"-style picture of the
	// differences between file1 and file2.

	var result = [];
	var tail1 = file1.length;
	var tail2 = file2.length;
	var common = {common: []};

	function processCommon() {
	    if (common.common.length) {
		common.common.reverse();
		result.push(common);
		common = {common: []};
	    }
	}

	for (var candidate = Diff.longest_common_subsequence(file1, file2);
	     candidate != null;
	     candidate = candidate.chain)
	{
	    var different = {file1: [], file2: []};

	    while (--tail1 > candidate.file1index) {
		different.file1.push(file1[tail1]);
	    }

	    while (--tail2 > candidate.file2index) {
		different.file2.push(file2[tail2]);
	    }

	    if (different.file1.length || different.file2.length) {
		processCommon();
		different.file1.reverse();
		different.file2.reverse();
		result.push(different);
	    }

	    if (tail1 >= 0) {
		common.common.push(file1[tail1]);
	    }
	}

	processCommon();

	result.reverse();
	return result;
    },

    diff_patch: function(file1, file2) {
	// We apply the LCD to build a JSON representation of a
	// diff(1)-style patch.

	var result = [];
	var tail1 = file1.length;
	var tail2 = file2.length;

	function chunkDescription(file, offset, length) {
	    var chunk = [];
	    for (var i = 0; i < length; i++) {
		chunk.push(file[offset + i]);
	    }
	    return {offset: offset,
		    length: length,
		    chunk: chunk};
	}

	for (var candidate = Diff.longest_common_subsequence(file1, file2);
	     candidate != null;
	     candidate = candidate.chain)
	{
	    var mismatchLength1 = tail1 - candidate.file1index - 1;
	    var mismatchLength2 = tail2 - candidate.file2index - 1;
	    tail1 = candidate.file1index;
	    tail2 = candidate.file2index;

	    if (mismatchLength1 || mismatchLength2) {
		result.push({file1: chunkDescription(file1,
						     candidate.file1index + 1,
						     mismatchLength1),
			     file2: chunkDescription(file2,
						     candidate.file2index + 1,
						     mismatchLength2)});
	    }
	}

	result.reverse();
	return result;
    },

    invert_patch: function(patch) {
	// Takes the output of Diff.diff_patch(), and inverts the
	// sense of it, so that it can be applied to file2 to give
	// file1 rather than the other way around.

	for (var i = 0; i < patch.length; i++) {
	    var chunk = patch[i];
	    var tmp = chunk.file1;
	    chunk.file1 = chunk.file2;
	    chunk.file2 = tmp;
	}
    },

    patch: function (file, patch) {
	// Applies a patch to a file.
	//
	// Given file1 and file2, Diff.patch(file1,
	// Diff.diff_patch(file1, file2)) should give file2.

	var result = [];
	var commonOffset = 0;

	function copyCommon(targetOffset) {
	    while (commonOffset < targetOffset) {
		result.push(file[commonOffset++]);
	    }
	}

	for (var chunkIndex = 0; chunkIndex < patch.length; chunkIndex++) {
	    var chunk = patch[chunkIndex];
	    copyCommon(chunk.file1.offset);
	    for (var lineIndex = 0; lineIndex < chunk.file2.length; lineIndex++) {
		result.push(chunk.file2.chunk[lineIndex]);
	    }
	    commonOffset += chunk.file1.length;
	}

	copyCommon(file.length);
	return result;
    },

    diff_indices: function(file1, file2) {
	// We apply the LCS to give a simple representation of the
	// offsets and lengths of mismatched chunks in the input
	// files. This is used by diff3_merge_indices below.

	var result = [];
	var tail1 = file1.length;
	var tail2 = file2.length;

	for (var candidate = Diff.longest_common_subsequence(file1, file2);
	     candidate != null;
	     candidate = candidate.chain)
	{
	    var mismatchLength1 = tail1 - candidate.file1index - 1;
	    var mismatchLength2 = tail2 - candidate.file2index - 1;
	    tail1 = candidate.file1index;
	    tail2 = candidate.file2index;

	    if (mismatchLength1 || mismatchLength2) {
		result.push({file1: [tail1 + 1, mismatchLength1],
			     file2: [tail2 + 1, mismatchLength2]});
	    }
	}

	result.reverse();
	return result;
    },

    diff3_merge_indices: function (a, o, b) {
	// Given three files, A, O, and B, where both A and B are
	// independently derived from O, returns a fairly complicated
	// internal representation of merge decisions it's taken. The
	// interested reader may wish to consult
	//
	// Sanjeev Khanna, Keshav Kunal, and Benjamin C. Pierce. "A
	// Formal Investigation of Diff3." In Arvind and Prasad,
	// editors, Foundations of Software Technology and Theoretical
	// Computer Science (FSTTCS), December 2007.
	//
	// (http://www.cis.upenn.edu/~bcpierce/papers/diff3-short.pdf)

	var m1 = Diff.diff_indices(o, a);
	var m2 = Diff.diff_indices(o, b);

	var hunks = [];
	function addHunk(h, side) {
	    hunks.push([h.file1[0], side, h.file1[1], h.file2[0], h.file2[1]]);
	}
	for (var i = 0; i < m1.length; i++) { addHunk(m1[i], 0); }
	for (var i = 0; i < m2.length; i++) { addHunk(m2[i], 2); }
	hunks.sort();

	var result = [];
	var commonOffset = 0;
	function copyCommon(targetOffset) {
	    if (targetOffset > commonOffset) {
		result.push([1, commonOffset, targetOffset - commonOffset]);
		commonOffset = targetOffset;
	    }
	}

	for (var hunkIndex = 0; hunkIndex < hunks.length; hunkIndex++) {
	    var firstHunkIndex = hunkIndex;
	    var hunk = hunks[hunkIndex];
	    var regionLhs = hunk[0];
	    var regionRhs = regionLhs + hunk[2];
	    while (hunkIndex < hunks.length - 1) {
		var maybeOverlapping = hunks[hunkIndex + 1];
		var maybeLhs = maybeOverlapping[0];
		if (maybeLhs >= regionRhs) break;
		regionRhs = maybeLhs + maybeOverlapping[2];
		hunkIndex++;
	    }

	    copyCommon(regionLhs);
	    if (firstHunkIndex == hunkIndex) {
		if (hunk[4] > 0) {
		    result.push([hunk[1], hunk[3], hunk[4]]);
		}
	    } else {
		var regions = [a.length, -1, regionLhs, regionRhs, b.length, -1];
		for (var i = firstHunkIndex; i <= hunkIndex; i++) {
		    var side = hunks[i][1];
		    var lhs = hunks[i][3];
		    var rhs = lhs + hunks[i][4];
		    var ri = side * 2;
		    regions[ri] = Math.min(lhs, regions[ri]);
		    regions[ri+1] = Math.max(rhs, regions[ri+1]);
		}
		result.push([-1,
			     regions[0], regions[1] - regions[0],
			     regions[2], regions[3] - regions[2],
			     regions[4], regions[5] - regions[4]]);
	    }
	    commonOffset = regionRhs;
	}

	copyCommon(o.length);
	return result;
    },

    diff3_merge: function (a, o, b, excludeFalseConflicts) {
	// Applies the output of Diff.diff3_merge_indices to actually
	// construct the merged file; the returned result alternates
	// between "ok" and "conflict" blocks.

	var result = [];
	var files = [a, o, b];
	var indices = Diff.diff3_merge_indices(a, o, b);

	var okLines = [];
	function flushOk() {
	    if (okLines) {
		result.push({ok: okLines});
	    }
	    okLines = [];
	}
	function pushOk(xs) {
	    for (var j = 0; j < xs.length; j++) {
		okLines.push(xs[j]);
	    }
	}

	function isTrueConflict(rec) {
	    if (rec[2] != rec[6]) return true;
	    var aoff = rec[1];
	    var boff = rec[5];
	    for (var j = 0; j < rec[2]; j++) {
		if (a[j + aoff] != b[j + boff]) return true;
	    }
	    return false;
	}

	for (var i = 0; i < indices.length; i++) {
	    var x = indices[i];
	    var side = x[0];
	    if (side == -1) {
		if (excludeFalseConflicts && !isTrueConflict(x)) {
		    pushOk(files[0].slice(x[1], x[1] + x[2]));
		} else {
		    flushOk();
		    result.push({conflict: {a: a.slice(x[1], x[1] + x[2]),
					    aIndex: x[1],
					    o: o.slice(x[3], x[3] + x[4]),
					    oIndex: x[3],
					    b: b.slice(x[5], x[5] + x[6]),
					    bIndex: x[5]}});
		}
	    } else {
		pushOk(files[side].slice(x[1], x[1] + x[2]));
	    }
	}

	flushOk();
	return result;
    }
}

});

require.define("/css_patcher.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var CSSPatcher, Patcher,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Patcher = require("./patcher");

  CSSPatcher = (function(_super) {

    __extends(CSSPatcher, _super);

    function CSSPatcher() {
      return CSSPatcher.__super__.constructor.apply(this, arguments);
    }

    CSSPatcher.prototype.insert = function(index, rules) {
      var i, rule, _i, _len, _results;
      _results = [];
      for (i = _i = 0, _len = rules.length; _i < _len; i = ++_i) {
        rule = rules[i];
        console.log("\tinsertRule('" + rule + "', " + (index + i) + ")");
        _results.push(this.patchee.insertRule(rule, index + i));
      }
      return _results;
    };

    CSSPatcher.prototype.remove = function(index, count) {
      var i, _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = count - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        console.log("\tdeleteRule(" + index + ")");
        _results.push(this.patchee.deleteRule(index));
      }
      return _results;
    };

    return CSSPatcher;

  })(Patcher);

  module.exports = CSSPatcher;

}).call(this);

});

require.define("/patcher.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var Patcher;

  Patcher = (function() {

    function Patcher(patchee) {
      this.patchee = patchee;
    }

    
  Patcher.prototype.apply_patch = function apply_patch(patch) {
    for (i=patch.length; i>0; i--) {
      var hunk = patch[i-1];
      this.apply_hunk(hunk)
    }
  }
  ;


    Patcher.prototype.apply_hunk = function(hunk) {
      var offset;
      offset = hunk.file1.offset;
      if (hunk.file1.length === 0) {
        return this.insert(offset, hunk.file2.chunk);
      } else if (hunk.file2.length === 0) {
        return this.remove(offset, hunk.file1.length);
      } else {
        this.remove(offset, hunk.file1.length);
        return this.insert(offset, hunk.file2.chunk);
      }
    };

    Patcher.prototype.insert = function(index, elements) {
      var args;
      args = [index, 0].concat(elements);
      console.log(args);
      return Array.prototype.splice.apply(this.patchee, args);
    };

    Patcher.prototype.remove = function(index, count) {
      console.log([index, count]);
      return this.patchee.splice(index, count);
    };

    return Patcher;

  })();

  module.exports = Patcher;

}).call(this);

});

require.define("/spire_manager.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var Channel, Spire, SpireManager;

  Spire = window.require("./spire.io.js");

  Channel = window.require("./spire/api/channel");

  SpireManager = (function() {

    function SpireManager(spire_url, accessors) {
      this.spire_url = spire_url;
      this.accessors = accessors;
      this.spire = new Spire({
        url: this.spire_url
      });
      this.channels = {};
    }

    SpireManager.prototype.start = function(callback) {
      var manager;
      manager = this;
      return this.spire.api.discover(function(err, discovered) {
        if (err) {
          return console.log(err);
        } else {
          manager.setup_publishers();
          manager.setup_listeners();
          return callback();
        }
      });
    };

    SpireManager.prototype.listen = function(callback) {
      this.subscription.addListener("message", callback);
      return this.subscription.startListening({
        last: "now"
      });
    };

    SpireManager.prototype.publish = function(name, data) {
      var channel;
      channel = this.channels[name];
      if (channel) {
        return channel.publish(data);
      } else {
        throw "No such channel: " + name;
      }
    };

    SpireManager.prototype.setup_publishers = function() {
      console.log("creating channels");
      this.css_channel = new Channel(this.spire, this.accessors.css);
      this.dom_channel = new Channel(this.spire, this.accessors.dom);
      this.snapshot_channel = new Channel(this.spire, this.accessors.snapshot);
      this.channels["css"] = this.css_channel;
      this.channels["dom"] = this.dom_channel;
      return this.channels["snapshot"] = this.snapshot_channel;
    };

    SpireManager.prototype.setup_listeners = function() {
      var Subscription;
      console.log("creating subscription");
      Subscription = window.require("./spire/api/subscription");
      return this.subscription = new Subscription(this.spire, this.accessors.subscription);
    };

    return SpireManager;

  })();

  module.exports = SpireManager;

}).call(this);

});

require.define("/dom_manager.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var DOMManager;

  DOMManager = (function() {

    function DOMManager() {
      this.ignore = false;
    }

    DOMManager.prototype.snapshot = function() {
      var body, head, image, link, _i, _j, _len, _len1, _ref, _ref1;
      head = document.head.cloneNode(true);
      body = document.body.cloneNode(true);
      _ref = head.getElementsByTagName("link");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        link.href = "data:text/css;base64,";
      }
      _ref1 = body.getElementsByTagName("img");
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        image = _ref1[_j];
        image.src = image.src.toString();
      }
      return {
        head: head.innerHTML,
        body: body.innerHTML
      };
    };

    DOMManager.prototype.clobber = function() {
      var manager, restore_link;
      manager = this;
      this.saved_head = document.head.cloneNode(true);
      this.saved_body = document.body.cloneNode(true);
      document.head.innerHTML = "<title>Synopticated!</title>\n<style>\n  body {\n    margin: 0px;\n  }\n  div#synopticon-control {\n    margin: 0px;\n    padding-top: 5px;\n    padding-bottom: 5px;\n    width: 100%;\n    background: #ddf;\n    border-bottom: 3px solid white;\n  }\n\n  div#synopticon-control span {\n    font-weight: bold;\n    margin-left: 1em;\n    margin-right: 4em;\n  }\n  a#synopticon-restore {\n  }\n</style>";
      document.body.innerHTML = "<div id=\"synopticon-control\">\n  <span>Synopticating!</span>\n  <a id=\"synopticon-restore\" href=\"\">Restore original</a>\n</div>\n<iframe id=\"synopticated\" frameborder=\"0\"\n  marginheight=\"0\" marginwidth=\"0\"\n  width=\"100%\" height=\"100%\" ></iframe>";
      this.init_iframe();
      restore_link = document.getElementById("synopticon-restore");
      return restore_link.addEventListener("click", function(event) {
        event.preventDefault();
        return manager.restore();
      });
    };

    DOMManager.prototype.init_iframe = function() {
      var manager;
      manager = this;
      this.iframe = document.getElementById("synopticated");
      this.iframe.contentDocument.head.innerHTML = "<style>\n  @-webkit-keyframes throb {\n    0%   {\n      opacity: 0.8;\n      margin-top: 5px;\n    }\n    40%  {\n      opacity: 0.4;\n      margin-top: 10px;\n    }\n    100% {\n      opacity: 0.8;\n      margin-top: 5px;\n    }\n  }\n  h2 {\n    text-align: center;\n    -webkit-animation-name: throb;\n    -webkit-animation-duration: 1.5s;\n    -webkit-animation-iteration-count: infinite;\n  }\n\n</style>";
      return this.iframe.contentDocument.body.innerHTML = "<h2>Waiting for snapshot from master</h2>";
    };

    DOMManager.prototype.apply_snapshot = function(data) {
      this.iframe.contentDocument.head.innerHTML = data.head;
      return this.iframe.contentDocument.body.innerHTML = data.body;
    };

    DOMManager.prototype.restore = function() {
      document.head.innerHTML = this.saved_head.innerHTML;
      return document.body.innerHTML = this.saved_body.innerHTML;
    };

    DOMManager.prototype.on_change = function(callback) {
      return document.addEventListener("DOMSubtreeModified", this.create_listener(callback));
    };

    DOMManager.prototype.create_listener = function(callback) {
      var manager;
      manager = this;
      return function(event) {
        var element, path;
        if (manager.usable_event(event)) {
          element = event.target;
          if (element.constructor === Text) {
            element = element.parentElement;
          }
          path = manager.xpath(element);
          return callback(path, element.outerHTML);
        }
      };
    };

    DOMManager.prototype.usable_event = function(event) {
      return this.ignore === false;
    };

    DOMManager.prototype.xpath = function(element) {
      var ix, sibling, siblings, _i, _len;
      if (element.id !== "") {
        return "id(\"" + element.id + "\")";
      } else if ((element === document.body) || (element === document.head)) {
        return "//" + element.tagName;
      } else {
        ix = 0;
        siblings = element.parentNode.childNodes;
        for (_i = 0, _len = siblings.length; _i < _len; _i++) {
          sibling = siblings[_i];
          if (sibling === element) {
            return this.xpath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
          }
          if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
          }
        }
      }
    };

    DOMManager.prototype.apply_change = function(path, data) {
      var found, iter;
      this.ignore = true;
      iter = this.iframe.contentDocument.evaluate(path, this.iframe.contentDocument, null, XPathResult.ANY_TYPE, null);
      found = iter.iterateNext();
      if (found) {
        console.log("DOM change:", path, data);
        found.outerHTML = data;
      } else {
        console.log("Couldn't find DOM element:");
        console.log(path, data);
      }
      return this.ignore = false;
    };

    return DOMManager;

  })();

  module.exports = DOMManager;

}).call(this);

});

require.define("/synopticon.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var CSSManager, DOMManager, SpireManager, Synopticon,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DOMManager = require("./dom_manager");

  CSSManager = require("./css_manager");

  SpireManager = require("./spire_manager");

  Synopticon = (function() {

    function Synopticon(spire_url, role, accessors) {
      this.spire_url = spire_url;
      this.role = role;
      this.accessors = accessors;
      this.send_css_change = __bind(this.send_css_change, this);

      this.send_dom_change = __bind(this.send_dom_change, this);

      if (this.role === "master") {
        console.log("starting Synopticon as master.", this.spire_url);
      } else if (this.role === "slave") {
        console.log("starting Synopticon as slave.", this.spire_url);
      } else {
        console.log("unknown role: " + role);
      }
      this.spire_manager = new SpireManager(this.spire_url, this.accessors);
      this.dom_manager = new DOMManager();
      this.css_manager = new CSSManager(1000);
    }

    Synopticon.prototype.listen = function() {
      var role, synopticon;
      synopticon = this;
      role = synopticon.role;
      return this.spire_manager.start(function() {
        return synopticon["start_" + role]();
      });
    };

    Synopticon.prototype.start_master = function() {
      this.spire_manager.publish("snapshot", {
        dom: this.dom_manager.snapshot(),
        css: this.css_manager.snapshot()
      });
      this.css_manager.on_change(this.send_css_change);
      return this.dom_manager.on_change(this.send_dom_change);
    };

    Synopticon.prototype.start_slave = function() {
      var synopticon;
      synopticon = this;
      this.dom_manager.clobber();
      return this.spire_manager.listen(function(message) {
        var channel, content;
        content = message.content;
        channel = message.data.channel_name;
        if (channel.indexOf(".dom") !== -1) {
          return synopticon.dom_manager.apply_change(content.path, content.data);
        } else if (channel.indexOf(".css") !== -1) {
          return synopticon.css_manager.patch(content);
        } else if (channel.indexOf(".snapshot") !== -1) {
          synopticon.dom_manager.apply_snapshot(message.content.dom);
          return synopticon.css_manager.apply_snapshot(message.content.css);
        } else {
          console.log(channel);
          return console.log(message.content);
        }
      });
    };

    Synopticon.prototype.send_dom_change = function(path, data) {
      return this.spire_manager.publish("dom", {
        path: path,
        data: data
      });
    };

    Synopticon.prototype.send_css_change = function(patchset) {
      console.log(patchset);
      return this.spire_manager.publish("css", patchset);
    };

    Synopticon.prototype.snapshot = function() {
      var css, dom;
      dom = this.dom_manager.snapshot();
      return css = this.css_manager.snapshot();
    };

    return Synopticon;

  })();

  module.exports = Synopticon;

}).call(this);

});
require("/synopticon.coffee");
