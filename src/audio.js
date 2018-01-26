var os = require("os");
var async = require("async");
var ffmpeg = require('fluent-ffmpeg');
var randomAccessFile = require('random-access-file');

var audioFrequency = 44100;
var channels = 1;

var clipAroundSeconds = 0.5;
var loudnessBucketsSeconds = 0.1;
var clipAroundBytes = secondsToBytes(clipAroundSeconds);
var loudnessBucketsBytes = secondsToBytes(loudnessBucketsSeconds);

function secondsToBytes(seconds){
    return audioFrequency * seconds * channels * 2;
}

function bytesToSeconds(bytes){
    return bytes / (audioFrequency * channels * 2);
}

function getLoudness(buffer, from, to){
    var sumSqr = 0;
    for(var i=from; i<to; i+=2){
        var frame = buffer.readInt16LE(i);
        sumSqr += frame * frame;
    }
    return sumSqr / (to - from);
}

function getPcm(inputVideo, outputAudio, cb){
    console.log("Writing PCM data to " + outputAudio);
    ffmpeg(inputVideo)
        .outputFormat('s16le')
        .audioCodec('pcm_s16le')
        .output(outputAudio)
        .audioFrequency(audioFrequency)
        .audioChannels(channels)
        .on("end", cb)
        .run();
}

function findBestCut(audioFile, targetSeconds, cb){
    var targetBytes = secondsToBytes(targetSeconds);

    audioFile.read(targetBytes - clipAroundBytes, 2 * clipAroundBytes, function(err, buffer) {
        var minLoudness = Number.MAX_SAFE_INTEGER;
        var minLoudnessOffset = clipAroundBytes;

        for(var i=0; i<buffer.length - loudnessBucketsBytes; i+=loudnessBucketsBytes){
            var loudness = getLoudness(buffer, i, i + loudnessBucketsBytes);
            if(loudness < minLoudness){
                minLoudness = loudness;
                minLoudnessOffset = i;
            }
        }

        minLoudnessOffset += (loudnessBucketsBytes / 2);
        var minLoudnessBytesInFile = targetBytes - clipAroundBytes + minLoudnessOffset;
        var minLoudnessSeconds = bytesToSeconds(minLoudnessBytesInFile);
        cb(null, minLoudnessSeconds);
    });
}

function findBestCuts(videoFile, clips, cb){
    var audioFile = os.tmpdir() + "/audio.raw";
    getPcm(videoFile, audioFile, function(){
        var file = randomAccessFile(audioFile);

        async.mapSeries(clips, function(clip, itemCb){
            findBestCut(file, clip.from, function(err, fromSeconds){
                if(err){
                    return cb(err);
                }
                findBestCut(file, clip.to, function(err, toSeconds){
                    if(err){
                        return cb(err);
                    }
                    itemCb(null, {
                        from: fromSeconds,
                        to: toSeconds
                    });
                });
            });
        }, cb);
    });
}

module.exports.findBestCuts = findBestCuts;
