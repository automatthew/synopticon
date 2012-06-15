class Synopticon
  class Watcher < Synopticon


    def diffit
      doc1 = Nokogiri::HTML(string1)
      doc2 = Nokogiri::HTML(string2)

      changes = {}

      doc1.diff(doc2) do |change, node|
        if change == "+" || change == "-"
          path = node.parent.path
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
    end

  end

end
