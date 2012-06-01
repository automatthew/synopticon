(function() {
  /* this could be any suitable commonjs require lib */
  var s=document.createElement("script");
  s.src="./build/synopticon.js";
  document.body.appendChild(s);
  s.onload = function () {
    console.log("worked");
  };
})();
