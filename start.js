var library = require("module-library")(require)

library.using(
  ["./", "web-site"],
  function(recordVideo, WebSite) {
    WebSite.provision(recordVideo)
    WebSite.megaBoot()
  }
)