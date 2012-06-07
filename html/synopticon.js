var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

if (!process.env) process.env = {};
if (!process.argv) process.argv = [];

require.define("path", function (require, module, exports, __dirname, __filename) {
function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

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

require.define("/dom_manager.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var DOMManager;

  DOMManager = (function() {
    var Snapshotter;

    function DOMManager() {
      this.ignore = false;
    }

    DOMManager.prototype.listen = function(callback) {
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
      iter = document.evaluate(path, document, null, XPathResult.ANY_TYPE, null);
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

    Snapshotter = (function() {

      function Snapshotter() {
        this.saved_head = document.head.cloneNode(true);
        this.bootstrap_styles();
      }

      Snapshotter.prototype.bootstrap_styles = function() {
        var head, i, index, j, link_node, new_link, rule, rules, rulesets, sheet, stylesheet, stylesheets, _i, _j, _len, _len1, _results;
        stylesheets = (function() {
          var _i, _len, _ref, _results;
          _ref = document.styleSheets;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            sheet = _ref[_i];
            _results.push(sheet);
          }
          return _results;
        })();
        head = document.createElement("head");
        rulesets = [];
        for (index = _i = 0, _len = stylesheets.length; _i < _len; index = ++_i) {
          stylesheet = stylesheets[index];
          if (stylesheet.href) {
            rules = (function() {
              var _j, _len1, _ref, _results;
              _ref = stylesheet.rules;
              _results = [];
              for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                rule = _ref[_j];
                _results.push(rule.cssText);
              }
              return _results;
            })();
            rulesets.push(rules);
            link_node = stylesheet.ownerNode;
            document.head.removeChild(link_node);
            new_link = this.empty_link();
            head.appendChild(new_link);
            new_link.setAttribute("orig_href", stylesheet.href);
          }
        }
        document.head.innerHTML = head.innerHTML;
        _results = [];
        for (i = _j = 0, _len1 = rulesets.length; _j < _len1; i = ++_j) {
          rules = rulesets[i];
          stylesheet = document.styleSheets[i];
          _results.push((function() {
            var _k, _len2, _results1;
            _results1 = [];
            for (j = _k = 0, _len2 = rules.length; _k < _len2; j = ++_k) {
              rule = rules[j];
              _results1.push(stylesheet.insertRule(rule, j));
            }
            return _results1;
          })());
        }
        return _results;
      };

      Snapshotter.prototype.empty_link = function() {
        var link;
        link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = "data:text/css;base64,";
        return link;
      };

      Snapshotter.prototype.find_stylesheet = function(href) {
        var sheet, _i, _len, _ref;
        _ref = document.styleSheets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sheet = _ref[_i];
          if (!sheet.href) {
            continue;
          }
          console.log("found", sheet.href);
          if (sheet.href.indexOf(href) !== -1) {
            return sheet;
          }
        }
      };

      Snapshotter.prototype.snapshot = function() {
        return {
          head: document.head.innerHTML,
          body: document.body.innerHTML
        };
      };

      Snapshotter.prototype.stylesheet_links = function() {
        var link, links, _i, _len, _results;
        links = document.getElementsByTagName("link");
        _results = [];
        for (_i = 0, _len = links.length; _i < _len; _i++) {
          link = links[_i];
          if (link.getAttribute("rel") === "stylesheet") {
            _results.push(console.log(link));
          }
        }
        return _results;
      };

      return Snapshotter;

    })();

    return DOMManager;

  })();

  module.exports = DOMManager;

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

require.define("/css_manager.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var CSSManager, CSSPatcher, Diff;

  Diff = require("./diff");

  CSSPatcher = require("./css_patcher");

  CSSManager = (function() {

    function CSSManager(interval) {
      this.interval = interval;
      this.last = this.process_stylesheets();
    }

    CSSManager.prototype.snapshot = function() {};

    CSSManager.prototype.listen = function(callback) {
      return setInterval(this.create_listener(callback), this.interval);
    };

    CSSManager.prototype.find_stylesheet_by_href = function(href) {};

    CSSManager.prototype.create_listener = function(callback) {
      var manager;
      manager = this;
      return function() {
        var current, d, diffs, i, new_rules, old_rules, worthy, _i, _len;
        current = manager.process_stylesheets();
        diffs = [];
        for (i = _i = 0, _len = current.length; _i < _len; i = ++_i) {
          new_rules = current[i];
          old_rules = manager.last[i];
          if (old_rules) {
            d = Diff.diff_patch(old_rules, new_rules);
            diffs.push(d);
          } else {
            diffs.push([]);
            console.log("couldn't find rules");
          }
        }
        manager.last = current;
        worthy = diffs.some(function(diff) {
          return diff.length > 0;
        });
        if (worthy) {
          return callback(diffs);
        }
      };
    };

    CSSManager.prototype.process_stylesheets = function() {
      var sheet, sheets, _i, _len, _ref;
      sheets = [];
      _ref = document.styleSheets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sheet = _ref[_i];
        sheets.push(this.process_sheet(sheet));
      }
      return sheets;
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

    CSSManager.prototype.apply_changes = function(index, data) {
      var patcher, stylesheet;
      stylesheet = document.styleSheets[index];
      patcher = new CSSPatcher(stylesheet);
      return patcher.apply_patch(data);
    };

    return CSSManager;

  })();

  module.exports = CSSManager;

}).call(this);

});

require.define("/synopticon.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var CSSManager, DOMManager, Synopticon,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DOMManager = require("./dom_manager");

  CSSManager = require("./css_manager");

  Synopticon = (function() {

    function Synopticon(spire_url, role, accessors) {
      this.spire_url = spire_url;
      this.role = role;
      this.accessors = accessors;
      this.send_css_change = __bind(this.send_css_change, this);

      this.send_dom_change = __bind(this.send_dom_change, this);

      if (this.role === "master") {
        console.log("starting Synopticon as master.");
      } else if (this.role === "slave") {
        console.log("starting Synopticon as slave.");
      } else {
        console.log("unknown role: " + role);
      }
      this.dom_manager = new DOMManager();
      this.css_manager = new CSSManager(2000);
    }

    Synopticon.prototype.listen = function() {
      var role, synopticon,
        _this = this;
      synopticon = this;
      role = synopticon.role;
      return this.inject_spire(function() {
        return synopticon["listen_" + role]();
      });
    };

    Synopticon.prototype.inject_spire = function(callback) {
      var s, synopticon,
        _this = this;
      synopticon = this;
      s = document.createElement("script");
      s.src = "https://raw.github.com/automatthew/synopticon/master/html/spire.io.bundle.js";
      document.head.appendChild(s);
      return s.addEventListener("load", function() {
        var Spire;
        Spire = window.require("./spire.io.js");
        _this.spire = new Spire({
          url: _this.spire_url
        });
        return _this.spire.api.discover(function(err, discovered) {
          if (err) {
            return console.log(err);
          } else {
            return callback();
          }
        });
      });
    };

    Synopticon.prototype.listen_master = function() {
      var Channel;
      Channel = window.require("./spire/api/channel");
      this.css_channel = new Channel(this.spire, this.accessors.css);
      this.dom_channel = new Channel(this.spire, this.accessors.dom);
      this.snapshot_channel = new Channel(this.spire, this.accessors.snapshot);
      this.css_manager.listen(this.send_css_change);
      return this.dom_manager.listen(this.send_dom_change);
    };

    Synopticon.prototype.listen_slave = function() {
      var Subscription, synopticon;
      synopticon = this;
      Subscription = window.require("./spire/api/subscription");
      this.subscription = new Subscription(this.spire, this.accessors.subscription);
      this.subscription.addListener("message", function(message) {
        var channel, content, i, patch, _i, _len, _results;
        content = message.content;
        channel = message.data.channel_name;
        if (channel.indexOf(".dom") !== -1) {
          return synopticon.dom_manager.apply_change(content.path, content.data);
        } else if (channel.indexOf(".css") !== -1) {
          _results = [];
          for (i = _i = 0, _len = content.length; _i < _len; i = ++_i) {
            patch = content[i];
            _results.push(synopticon.css_manager.apply_changes(i, patch));
          }
          return _results;
        } else {
          console.log(channel);
          return console.log(message.content);
        }
      });
      return this.subscription.startListening({
        last: "now"
      });
    };

    Synopticon.prototype.send_dom_change = function(path, data) {
      console.log(path, data);
      return this.dom_channel.publish({
        path: path,
        data: data
      });
    };

    Synopticon.prototype.send_css_change = function(patchset) {
      console.log(patchset);
      return this.css_channel.publish(patchset);
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
