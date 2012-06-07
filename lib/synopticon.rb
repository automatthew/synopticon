require "rubygems"
require "json"
require "spire_io"
require "erb"

class SynopticonSetup

  def initialize(options)
    @secret = options[:secret]
    @spire_url = options[:spire_url]
    @app_name = options[:application]
    @target = options[:target]
  end

  def bookmarklet_page(options)
    accessors = self.accessors
    template = File.read("html/template.html.erb")
    erb = ERB.new(template)
    url = "#{options[:synopticon_url]}/synopticon.js"
    spire_url = @spire_url
    master_accessors = accessors[:master].to_json.gsub('"', "'")
    slave_accessors = accessors[:slave].to_json.gsub('"', "'")

    html = erb.result(binding)
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

end



