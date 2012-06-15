require "optparse"

require "rubygems"
require "json"
require "spire_io"

class Synopticon

  def self.command(name)
    case name
    when "bookmark", "bookmarker"
      Synopticon::Bookmarker.new
    when "watcher"
      Synopticon::Watcher.new
    when "listener"
      Synopticon::Listener.new
    else
      puts "Usage: synopticon <command> [options]"
      puts "Available commands: bookmarklet, watch, listen"
      exit
    end
  end

  def options
    @options ||= {
      :spire_url => "https://api.spire.io",
      :synopticon_url =>
        "https://raw.github.com/automatthew/synopticon/master/browser",
      :application => "synopticon",
      :target => "default",
      :secret_file => ".spire_secret",
    }
  end

  def parser
    OptionParser.new do |parser|
      parser.on("-a", "--application=NAME",
        "name of Spire app. Defaults to 'synopticon'") do |name|
        options[:application] = name
      end
      parser.on("-n", "--name=NAME",
        "arbitrary name for the editing session") do |name|
        options[:target] = name
      end
      parser.on("-s", "--secret=FILE",
        "path to account secret file.  Defaults to .spire_secret") do |file|
        options[:secret_file] = file
      end
      parser.on("-d", "--dev",
        "Development mode. Use dev spire server, secret, and js") do
        options[:development_mode] = true
        options[:spire_url] = "http://localhost:1337"
        options[:synopticon_url] = "http://localhost:8000"
        options[:secret_file] = ".spire_secret.dev"
      end
    end
  end

  def help
    parser.help
  end

  attr_reader :messages

  def initialize
    self.parser.parse!
    @secret = File.read(options[:secret_file]).chomp
    @spire_url = options[:spire_url]
    @app_name = options[:application]
    @target = options[:target]
    @messages = Synopticon::Messages.new(
      :url => @spire_url, :secret => @secret,
      :application => @app_name
    )
  end

  def accessors
    return @accessors if @accessors

    api = Spire::API.new(@spire_url)
    api.discover

    dom_name = "#{@target}.dom"
    css_name = "#{@target}.css"
    snapshot_name = "#{@target}.snapshot"

    @session = api.create_session(@secret)

    begin
      @application = @session.get_application(@app_name)
    rescue
      @application = @session.create_application(@app_name)
    end

    begin
      @dom_channel = @application.create_channel(dom_name)
    rescue
      @dom_channel = @application.channels[dom_name]
    end

    begin
      @css_channel = @application.create_channel(css_name)
    rescue
      @css_channel = @application.channels[css_name]
    end

    begin
      @snapshot_channel = @application.create_channel(snapshot_name)
    rescue
      @snapshot_channel = @application.channels[snapshot_name]
    end
    

    @subscription = @application.create_subscription(
      nil,
      [dom_name, css_name, snapshot_name]
    )

    master = {
      :dom => {
        :url => @dom_channel.url,
        :capabilities => {
          :publish => @dom_channel.capabilities["publish"]
        }
      },
      :css => {
        :url => @css_channel.url,
        :capabilities => {
          :publish => @css_channel.capabilities["publish"]
        }
      },
      :snapshot => {
        :url => @snapshot_channel.url,
        :capabilities => {
          :publish => @snapshot_channel.capabilities["publish"]
        }
      },
    }
    slave = {
      :subscription => {
        :url => @subscription.url,
        :capabilities => {
          :events => @subscription.capabilities["events"]
        }
      },
    }

    @accessors = {:master => master, :slave => slave}
  end

end


require "synopticon/messages"
require "synopticon/bookmarker"
require "synopticon/watcher"

