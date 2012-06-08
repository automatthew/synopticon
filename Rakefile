require "pp"

$BROWSERIFY = "node_modules/browserify/bin/cmd.js"
$BROWSERIFY_OPTIONS = "-o html/synopticon.js"

file $BROWSERIFY => "npm_update"

task "update" => %w[npm_update]

task "npm_update" do
  sh "npm install"
end

task "build" => $BROWSERIFY do
  sh "#{$BROWSERIFY} src/synopticon.coffee #{$BROWSERIFY_OPTIONS}"
end

task "build:watch" => $BROWSERIFY do
  sh "#{$BROWSERIFY} src/synopticon.coffee #{$BROWSERIFY_OPTIONS} --watch"
end

