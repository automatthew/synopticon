
$BROWSERIFY = "node_modules/browserify/bin/cmd.js"
$BROWSERIFY_OPTIONS = "-o browser/synopticon.js --prelude false"

file $BROWSERIFY => "npm_update"

task "update" => %w[npm_update]

task "npm_update" do
  sh "npm install"
end

desc "Browserify to browser/synopticon.js"
task "build" => $BROWSERIFY do
  sh "#{$BROWSERIFY} src/synopticon.coffee #{$BROWSERIFY_OPTIONS}"
end

desc "Browserify with --watch to browser/synopticon.js"
task "build:watch" => $BROWSERIFY do
  sh "#{$BROWSERIFY} src/synopticon.coffee #{$BROWSERIFY_OPTIONS} --watch"
end

task "server" do
  Dir.chdir("browser") do
    sh "python -m SimpleHTTPServer"
  end
end

