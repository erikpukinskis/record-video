var library = require("module-library")(require)

library.define(
  "record-daisy",
  ["web-element", "web-site", "browser-bridge"],
  function(element, site, bridge) {

    return function(site) {
      var page = element([
        element("script", {src: "https://api.clipchamp.com/"+process.env.CLIPCHAMP_API_KEY+"/button.js"}),
        element(".climpchamp-wrapper"),
      ])

      brige.asap(function() {
        clipchamp.preload()
        var el = document.querySelector(".climpchamp-wrapper")
        clipchamp(el)
      })

      site.addRoute("get", "/", bridge.requestHandler(page))
    }
  }
)