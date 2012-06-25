class Synopticon
  class Bookmarker < Synopticon

    def parser
      optparser = super
      optparser.banner = <<-BANNER

Usage: synopticon bookmark [options]

      BANNER
      optparser.on("-o",
        "--output=FILE", "write bookmarklet page to FILE") do |file|
        options[:output] = file
      end
      optparser
    end

    def run
      master_anchor = anchor_template(
        "master",
        :spire_js => "#{options[:synopticon_url]}/spire.io.bundle.js",
        :synopticon_url => "#{options[:synopticon_url]}/synopticon.js",
        :spire_url => @spire_url,
        :accessors => self.messages.accessors[:master].to_json.gsub('"', "'")
      )
      slave_anchor = anchor_template(
        "slave",
        :spire_js => "#{options[:synopticon_url]}/spire.io.bundle.js",
        :synopticon_url => "#{options[:synopticon_url]}/synopticon.js",
        :spire_url => @spire_url,
        :accessors => self.messages.accessors[:slave].to_json.gsub('"', "'")
      )
      html = html_template([master_anchor, slave_anchor])
      if options[:output]
        File.open(options[:output], "w") do |f|
          f.puts(html)
        end
      else
        puts html
      end
    end

    def html_template(bookmarks)
      paragraphs = bookmarks.map {|a| "<p>#{a}</p>" }.join("\n    ")
      html = <<-TEMPLATE
  <html>
    <head><title>Synopticon Bookmarklets</title></head>
    <body><h1>Synopticon Bookmarklets</h1>
      #{paragraphs}
      <p>Use it wisely.</p>
    </body>
  </html>
      TEMPLATE
    end

    def anchor_template(name, options)
      a = <<-TEMPLATE
      <a href="javascript:(function() {
        var s=document.createElement('script');
        s.src='#{options[:spire_js]}';
        document.head.appendChild(s);
        s.onload = function () {
          var s=document.createElement('script');
          s.src='#{options[:synopticon_url]}';
          document.head.appendChild(s);
          s.onload = function () {
            Synopticon = require('/synopticon');
            syn = new Synopticon(
              '#{options[:spire_url]}', '#{name}', #{options[:accessors]}
            );
            syn.listen();
          };
        };
      })();
      ">#{name}</a>
      TEMPLATE
      a.gsub(/\s{2,}/, "").chomp
    end

  end
end
