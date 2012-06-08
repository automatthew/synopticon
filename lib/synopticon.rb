require "rubygems"
require "json"
require "spire_io"

class SynopticonSetup

  def initialize(options)
    @secret = options[:secret]
    @spire_url = options[:spire_url]
    @app_name = options[:application]
    @target = options[:target]
  end

  def accessors
    api = Spire::API.new(@spire_url)
    api.discover

    dom_name = "#{@target}.dom"
    css_name = "#{@target}.css"
    snapshot_name = "#{@target}.snapshot"

    session = api.create_session(@secret)

    begin
      application = session.get_application(@app_name)
    rescue
      application = session.create_application(@app_name)
    end

    begin
      dom_channel = application.create_channel(dom_name)
    rescue
      dom_channel = application.channels[dom_name]
    end

    begin
      css_channel = application.create_channel(css_name)
    rescue
      css_channel = application.channels[css_name]
    end

    begin
      snapshot_channel = application.create_channel(snapshot_name)
    rescue
      snapshot_channel = application.channels[snapshot_name]
    end
    

    subscription = application.create_subscription(
      nil,
      [dom_name, css_name, snapshot_name]
    )

    master = {
      :dom => {
        :url => dom_channel.url,
        :capabilities => {
          :publish => dom_channel.capabilities["publish"]
        }
      },
      :css => {
        :url => css_channel.url,
        :capabilities => {
          :publish => css_channel.capabilities["publish"]
        }
      },
      :snapshot => {
        :url => snapshot_channel.url,
        :capabilities => {
          :publish => snapshot_channel.capabilities["publish"]
        }
      },
    }
    slave = {
      :subscription => {
        :url => subscription.url,
        :capabilities => {
          :events => subscription.capabilities["events"]
        }
      },
    }

    {:master => master, :slave => slave}
  end

  def bookmarklet_page(options)
    master_anchor = anchor_template(
      "master",
      :spire_js => "#{options[:synopticon_url]}/spire.io.bundle.js",
      :synopticon_url => "#{options[:synopticon_url]}/synopticon.js",
      :spire_url => @spire_url,
      :accessors => self.accessors[:master].to_json.gsub('"', "'")
    )
    slave_anchor = anchor_template(
      "slave",
      :spire_js => "#{options[:synopticon_url]}/spire.io.bundle.js",
      :synopticon_url => "#{options[:synopticon_url]}/synopticon.js",
      :spire_url => @spire_url,
      :accessors => self.accessors[:slave].to_json.gsub('"', "'")
    )
    html_template([master_anchor, slave_anchor])
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



