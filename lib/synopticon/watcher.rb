class Synopticon
  class Watcher < Synopticon

    def options
      @options ||= super.merge(
        :root => File.expand_path(Dir.pwd)
      )
    end

    def parser
      optparser = super
      optparser.banner = <<-BANNER

Usage: synopticon watcher [options]

      BANNER
      optparser.on("-h", "--html=FILE", "HTML file to watch") do |file|
        options[:html] = file
      end
      optparser.on("-r", "--root=DIR", "path to treat as webserver root") do |path|
        options[:root] = File.expand_path(path)
      end
      optparser
    end

    def run
      @html_file = File.expand_path(options[:html])
      @base_document = read_html(@html_file)
      #string = File.read(@html_file)
      #@base_document = Nokogiri::HTML(string)

      puts "Listening for changes..."
      files = [@html_file] + css_files
      puts "  " << files.join("\n  ")
      listen
    end

    def read_html(path)
      string = File.read(path)
      Nokogiri::HTML(string)
    end

    def listen
      messages.setup
      html_listener = Listen.to(File.dirname(@html_file))
      # Constructing an ugly regex when we know exactly what file we want is
      # fairly silly, but that's what Listen requires.  Thus casting doubt
      # on the wisdom of using Listen.  Manual polling at half-second
      # intervals may well be a better solution.
      file_regex = Regexp.new("^#{Regexp.escape(File.basename(@html_file))}")
      html_listener.filter(file_regex)
      html_listener.change do |modified, added, removed|
        modified.each do |path|
          if path == @html_file
            newest = read_html(@html_file)
            patch = diff(@base_document, newest)
            messages.channels[:dom].publish(patch)
            @base_document = newest
          end
        end
        if removed.include?(@html_file)
          raise "The watched HTML file was deleted?!"
        end
      end
      html_listener.start
    end

    def css_files
      hrefs = @base_document.xpath("//head/link[@rel='stylesheet']").map do |link|
        if link["href"].index("http") != 0
          "#{options[:root]}/#{link["href"]}"
        end
      end
      hrefs.compact
    end

    def diff(doc1, doc2)
      changes = {}

      doc1.diff(doc2) do |change, node|
        if change == "+" || change == "-"
          path = "/" << node.parent.path
          next if changes[path]
          if changes.empty?
            changes[path] = doc2.xpath(node.parent.path).to_html
          end
          changes.each do |existing_path, n|
            if existing_path.index(path) == 0
              # there exists a deeper path
              changes.delete("existing_path")
            elsif path.index(existing_path) == 0
              # there exists a shallower path, so do not
              # save the current, deeper path.
            else
              changes[path] = doc2.xpath(node.parent.path).to_html
            end
          end
        end
      end
      changes
    end

  end

end
