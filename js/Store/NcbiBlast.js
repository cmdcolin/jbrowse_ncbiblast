define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/request',
    'jszip/jszip'
],
function (
    declare,
    array,
    request,
    JSZip
) {
    return declare(null, {
        constructor: function (args) {
            this.browser = args.browser;
            this.maxTries = args.maxTries || 100;
            this.refreshRate = args.refreshRate || 10000;
        },
        cancel: function() {
            if (this.waiting) {
                clearInterval(this.waiting);
            }
            if (this.timer) {
                clearInterval(this.timer);
            }
            this.inProgress = false;
        },

        fetch: function (query, featureCallback, waitCallback, errorCallback) {
            var thisB = this;
            this.inProgress = true;
            request(this.browser.config.blastURL + '?QUERY=' + query + '&DATABASE=' + this.browser.config.blastDB + '&PROGRAM=blastn&CMD=Put').then(function (res) {
                var m = res.match(/QBlastInfoBegin([\s\S)]*?)QBlastInfoEnd/);
                var rid = m[1].match(/RID = (.*)/)[1];
                var rtoe = +m[1].match(/RTOE = (.*)/)[1];
                if (!rid) {
                    errorCallback('Error: no job submitted');
                    thisB.cancel();
                    return;
                }
                var count = 0;
                var waitCounter = 0;
                waitCallback(rtoe, waitCounter);
                var waiting = thisB.waiting = setInterval(function () {
                    waitCallback(rtoe, ++waitCounter);
                }, 700);

                var timer = thisB.timer = setInterval(function () {
                    request(thisB.browser.config.blastURL + '?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=' + rid).then(function (data) {
                        count++;
                        if (count > thisB.maxTries) {
                            errorCallback('Error: timed out (requested status > 100 times)');
                            clearInterval(timer);
                            clearInterval(waiting);
                            thisB.cancel();
                        }
                        var d = data.match(/QBlastInfoBegin([\s\S)]*?)QBlastInfoEnd/);
                        var stat = d[1].match(/Status=(.*)/)[1];
                        if (stat == 'WAITING') {
                            console.log('waiting');
                        } else if (stat == 'UNKNOWN') {
                            console.log('unknown', data);
                        } else if (stat == 'READY') {
                            clearInterval(timer);

                            var url = thisB.browser.config.blastURL + '?FORMAT_TYPE=JSON2&CMD=Get&RID=' + rid;
                            var oReq = new XMLHttpRequest();
                            oReq.open('GET', url, true);
                            oReq.responseType = 'arraybuffer';

                            oReq.onload = function (/* oEvent */) {
                                dojo.destroy('waiting_blast');
                                clearInterval(waiting);

                                var arrayBuffer = oReq.response; // Note: not oReq.responseText
                                if (arrayBuffer) {
                                    JSZip.loadAsync(arrayBuffer).then(function (zipFile) {
                                        zipFile.file(rid + '.json').async('string').then(function (content) {
                                            var filename = JSON.parse(content).BlastJSON[0].File;
                                            zipFile.file(filename).async('string').then(function (blastResults) {
                                                var blastRes = JSON.parse(blastResults).BlastOutput2.report.results.search;
                                                console.log(blastRes);
                                                featureCallback(blastRes);
                                                thisB.inProgress = false;
                                            });
                                        });
                                    });
                                    return;
                                }
                            };
                            oReq.send(null);
                        }
                    }, function (error) {
                        errorCallback('Error checking status', error);
                        thisB.cancel();
                    });
                }, thisB.refreshRate);
            }, function (error) {
                console.error('Error doing BLAST', error);
                thisB.cancel();
            });
        }
    });
});
