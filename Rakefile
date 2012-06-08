require "pp"

$COFFEE = "node_modules/coffee-script/bin/coffee"

$BROWSERIFY = "node_modules/browserify/bin/cmd.js"
$BROWSERIFY_OPTIONS = "-o html/synopticon.js"

task "build" => %w[build/diff.js] do
  sh "#{$BROWSERIFY} src/synopticon.coffee #{$BROWSERIFY_OPTIONS}"
end

task "update" do
  sh "npm install"
end

file "build/diff.js" do
  cp "src/diff.js", "build/"
end

task "build:watch" do
  sh "#{$BROWSERIFY} src/synopticon.coffee #{$BROWSERIFY_OPTIONS} --watch"
end

