$COFFEE = "node_modules/coffee-script/bin/coffee"

task "build" do
	sh "node_modules/browserify/bin/cmd.js src/synopticon.coffee -o build/synopticon.js"
end

task "build:watch" do
	sh "node_modules/browserify/bin/cmd.js src/synopticon.coffee -o build/synopticon.js --watch"
end

task "secret" => ".spirerc"

file ".spirerc" do
  puts "Create a file named .spirec containing your SOMETHING secret"
  exit
end


