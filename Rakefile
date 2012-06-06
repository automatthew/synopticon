$COFFEE = "node_modules/coffee-script/bin/coffee"

$BROWSERIFY = "node_modules/browserify/bin/cmd.js"
$BROWSERIFY_OPTIONS = "-o html/synopticon.js"

task "build" => %w[build/diff.js] do
  #sh "#{$COFFEE} -o build/ -c src/*.coffee"
  sh "#{$BROWSERIFY} src/synopticon.coffee #{$BROWSERIFY_OPTIONS}"
end

file "build/diff.js" do
  cp "src/diff.js", "build/"
end

task "build:watch" do
  #sh "#{$COFFEE} -o build/ -c src/*.coffee"
  sh "#{$BROWSERIFY} src/synopticon.coffee #{$BROWSERIFY_OPTIONS} --watch"
end

task "secret" => ".spirerc"

file ".spirerc" do
  puts "Create a file named .spirec containing your SOMETHING secret"
  exit
end


