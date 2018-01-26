var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');
var audio = require("./audio.js");
var video = require("./video.js");

function loadInput(filePath){
    return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
}

var inputFile = "data/video.yaml";
var outputFile = "out/output.mp4";
var inputDir = path.dirname(inputFile);

var input = loadInput(inputFile);
var inputVideo = path.join(inputDir, input.input);

audio.findBestCuts(inputVideo, input.clips, function(err, clips){
    console.log(clips);
    video.makeVideo(inputVideo, outputFile, clips, function(){
        console.log("Saved to " + outputFile);
    });
});
