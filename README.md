# Synopticon

Sync DOM and CSS changes to a page between browsers using real time notifications.

Create a file named `.spire_secret`, containing your spire.io account secret, then run this command:

    bin/synopticon -o bookmarklets.html

`bookmarklets.html` should now contain a simple web page with two bookmarklet links: one for the master session, and one for slave sessions.

The command creates or retrieves a Spire application named "synopticon", then creates channels for the "default" editing target.  You can specify custom targets (really just arbitrary session names, so you can have more than one editing session at a time) using the `-n` flag.


