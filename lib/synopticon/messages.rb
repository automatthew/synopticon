class Synopticon

  class Messages

    def initialize(options)
      @secret = options[:secret]
      @api = Spire::API.new(options[:url])
      @app_name = options[:application]
      @api.discover
      @channels = {}
    end

    def setup
      return if @subscription

      dom_name = "#{@target}.dom"
      css_name = "#{@target}.css"
      snapshot_name = "#{@target}.snapshot"

      @session = @api.create_session(@secret)

      begin
        @application = @session.get_application(@app_name)
      rescue
        @application = @session.create_application(@app_name)
      end

      begin
        @channels[:dom] = @application.create_channel(dom_name)
      rescue
        @channels[:dom] = @application.channels[dom_name]
      end

      begin
        @channels[:css] = @application.create_channel(css_name)
      rescue
        @channels[:css] = @application.channels[css_name]
      end

      begin
        @channels[:snapshot] = @application.create_channel(snapshot_name)
      rescue
        @channels[:snapshot] = @application.channels[snapshot_name]
      end
      

      @subscription = @application.create_subscription(
        nil,
        [dom_name, css_name, snapshot_name]
      )

    end

    def accessors
      self.setup

      master = {
        :dom => {
          :url => @channels[:dom].url,
          :capabilities => {
            :publish => @channels[:dom].capabilities["publish"]
          }
        },
        :css => {
          :url => @channels[:css].url,
          :capabilities => {
            :publish => @channels[:css].capabilities["publish"]
          }
        },
        :snapshot => {
          :url => @channels[:snapshot].url,
          :capabilities => {
            :publish => @channels[:snapshot].capabilities["publish"]
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

end
