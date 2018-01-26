var ffmpeg = require('fluent-ffmpeg');
var async = require("async");
var os = require("os");
var fs = require("fs");
var path = require("path");
var tmp = require('tmp');

var tmpDir = tmp.dirSync().name;

function outputClip(inputFile, outputFile, from, to, cb){
    ffmpeg(inputFile)
        .seekInput(from)
        .duration(to - from)
        .output(outputFile)
        .on("end", cb)
        .run();
}

function mergeClips(clipFiles, outputFile, cb){
    var inputsFile = path.join(path.dirname(clipFiles[0]), "inputs.txt");
    var inputsString = "";
    for(i in clipFiles){
        inputsString += "file '" + path.basename(clipFiles[i]) + "'\n";
    }
    fs.writeFileSync(inputsFile, inputsString);
    ffmpeg(inputsFile)
        .inputFormat("concat")
        .output(outputFile)
        .on("end", cb)
        .run();
}

function generateClips(inputFile, clips, cb){
    var clipNum = 0;
    async.mapSeries(clips, function(clip, itemCb){
        var clipFile = path.join(tmpDir, "clip" + clipNum + ".mp4");
        console.log("Generating " + clipFile);
        clipNum++;
        outputClip(inputFile, clipFile, clip.from, clip.to, function(){
            itemCb(null, clipFile);
        });
    }, cb);
}

function makeVideo(inputFile, outputFile, clips, cb){
    generateClips(inputFile, clips, function(err, clipFiles){
        if(err){
            return cb(err);
        }
        mergeClips(clipFiles, outputFile, cb);
    });
}

module.exports.makeVideo = makeVideo;
