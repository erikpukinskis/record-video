var library = require("module-library")(require)

// Possible way to capture frames:
// https://github.com/GoogleChrome/imagecapture-polyfill
// (also good suggestion for ways to do it old school)

// Library for cross-browser getUserMedia
// https://github.com/otalk/getUserMedia/blob/master/getusermedia.js

// Screen recording:
// https://github.com/otalk/getScreenMedia/blob/master/getscreenmedia.js

// Example use of RecordRTC:
// https://github.com/collab-project/videojs-record

// Example of raw getUserMedia use, with upload:
// http://stackoverflow.com/a/16784584/778946

module.exports = library.export(
  "record-video",
  ["web-element", "web-site", "browser-bridge", "crypto", "moment", "aws-sdk", "zencoder", "browser-bridge", "web-element", "path"],
  function(element, site, bridge, crypto, moment, AWS, zencoder, BrowserBridge, element, path) {

    // Based off https://blog.zencoder.com/2014/07/28/html5-video-and-the-end-of-plugins-recording-uploading-and-transcoding-video-straight-from-the-browser/

    var S3_BUCKET = 'daisy-june'

    var s3 = new AWS.S3({ params: { Bucket: S3_BUCKET }})
     
    function createS3Policy() {
      var policy = {
        "expiration": moment().utc().add('days', 1).toISOString(),
        "conditions": [
          { "bucket": S3_BUCKET },
          { "acl":"private" },
          [ "starts-with", "$key", "" ],
          [ "starts-with", "$Content-Type", "" ],
          [ "content-length-range", 0, 5368709120 ]
        ]
      };
     
      var base64Policy = new Buffer(JSON.stringify(policy)).toString('base64');
      var signature = crypto.createHmac('sha1', AWS.config.credentials.secretAccessKey).update(base64Policy).digest('base64');
     
      return {
        key: AWS.config.credentials.accessKeyId,
        policy: base64Policy,
        signature: signature
      };
    }
     
    function createJob(input, email, cb) {
      var watermark = {
        url: 'https://s3.amazonaws.com/zencoder-demo/blog-posts/videobooth.png',
        x: '-0',
        y: '-0',
        width: '30%'
      };
     
      zencoder.Job.create({
        input: input,
        notifications: [ email ],
        outputs: [
          { format: 'mp4', watermarks: [watermark] },
          { format: 'webm', watermarks: [watermark] }
        ]
      }, cb);
    }
     
    function boot(site) {

      site.addRoute("post", '/process', function(req, res) {
        // Build up the S3 URL based on the specified S3 Bucket and filename included
        // in the POST request body.
        var input = 'https://'+S3_BUCKET+'.s3.amazonaws.com/'+req.body.filename;
        createJob(input, req.body.email, function(err, data) {
          if (err) { return res.send(500, err); }
       
          res.send(200, data);
       
        });
      });
       
      site.addRoute("post", '/upload', function(req, res) {
        var cors = createS3Policy();
        res.send(201, { url: 'https://'+S3_BUCKET+'.s3.amazonaws.com/', cors: cors });
      });

      var recordBridge = new BrowserBridge()

      var startRecording = recordBridge.defineFunction(function() {

        getUserMedia(displayIt)

        function displayIt(error, stream) {
          if (error) { throw new Error("No video! "+error) }

          var video = document.querySelector('video')

          video.srcObject = stream
        }
      })

      var recordPage = element([
        element("video", {
          width: "480",
          height: "360",
          autoplay: "true",
        }),
        element("button", "record", {onclick: startRecording.evalable()})
      ])

      recordBridge.addToHead(
        element("script", {src: "/get-user-media.js"})
      )

      site.addRoute("get", "/record-video", recordBridge.requestHandler(recordPage))

      site.addRoute(
        "get",
        "/get-user-media.js",
        site.sendFile("./get-user-media.js")
      )
       
    }

    return boot
  }
)