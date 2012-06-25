require "pp"
require "optparse"

require "rubygems"
require "json"
require "listen"
require "nokogiri/diff"

require "spire_io"

# Base class to establish the common options parsing and set up
# the messaging connection.
#
# Subclasses implement #run, which will be called by command dispatcher
# in bin/synopticon. Subclasses may extend the options parser by overriding
# #parser (using #super to get the # base parser).
#
# Default options live in the #options method, which is also a prime
# place for overrides.
class Synopticon

  # Map command names to classes.
  def self.command(name)
    case name
    when "bookmark"
      Synopticon::Bookmarker.new
    when "watch"
      Synopticon::Watcher.new
    when "listener"
      Synopticon::Listener.new
    else
      puts "Usage: synopticon <command> [options]"
      puts "Available commands: bookmark, watch, listen"
      exit
    end
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

end

require "synopticon/messages"
require "synopticon/bookmarker"
require "synopticon/watcher"

