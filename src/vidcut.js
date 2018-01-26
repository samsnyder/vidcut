var yaml = require('js-yaml');
var fs = require('fs');
var path = require('path');
var audio = require("./audio.js");
var video = require("./video.js");

function loadInput(filePath){
    return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
}

if(process.argv.length != 4){
    console.log("Usage: vidcut <input_yaml> <output_video>");
    process.exit(1);
}

var inputFile = process.argv[2];
var outputFile = process.argv[3];
var inputDir = path.dirname(inputFile);

var input = loadInput(inputFile);
var inputVideo = path.join(inputDir, input.input);

audio.findBestCuts(inputVideo, input.clips, function(err, clips){
    video.makeVideo(inputVideo, outputFile, clips, function(){
        console.log("Saved to " + outputFile);
    });
});
