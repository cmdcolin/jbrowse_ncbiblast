define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/request',
    'dijit/focus',
    'dijit/form/Textarea',
    'JBrowse/View/Dialog/WithActionBar',
    'JBrowse/Store/RemoteBinaryFile',
    'jszip/jszip',
    'dojo/on',
    'dijit/form/Button'
],
function (
    declare,
    dom,
    request,
    focus,
    TextArea,
    ActionBarDialog,
    RemoteBinaryFile,
    JSZip,
    on,
    Button
) {
    this.instanceCounter = 0;
    return declare(ActionBarDialog, {

        title: 'Search NCBI BLAST',

        constructor: function (args) {
            this.height = args.height || 100;
            this.browser = args.browser;
            this.setCallback    = args.setCallback || function () {};
            this.cancelCallback = args.cancelCallback || function () {};
        },

        _fillActionBar: function (actionBar) {
            var thisB = this;
            new Button({
                label: 'Search',
                onClick: dojo.hitch(this, function () {
                    thisB.searchNCBI(this.textarea.value);
                })
            }).placeAt(actionBar);

            new Button({
                label: 'Cancel',
                onClick: dojo.hitch(this, function () {
                    this.cancelCallback && this.cancelCallback();
                    this.hide();
                })
            }).placeAt(actionBar);
        },

        show: function (callback) {
            dojo.addClass(this.domNode, 'blastDialog');

            this.textarea = dom.create('textarea', {
                id: 'query_blast', style: {
                    width: '500px',
                    height: '200px'
                }
            });

            this.set('content', [
                dom.create('label', { 'for': 'query_blast', innerHTML: '' }),
                this.textarea,
                dom.create('p', { id: 'status_blast' }),
                dom.create('p', { id: 'waiting_blast' }),
                dom.create('p', { id: 'results_blast' })
            ]);

            this.inherited(arguments);
        },

        hide: function () {
            this.inherited(arguments);
            window.setTimeout(dojo.hitch(this, 'destroyRecursive'), 500);
        },

        searchNCBI: function (query) {
            console.log(query);
            request('https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi?QUERY=' + query + '&DATABASE=nt&PROGRAM=blastn&CMD=Put').then(function (res) {
                var m = res.match(/QBlastInfoBegin([\s\S)]*?)QBlastInfoEnd/);
                var rid = m[1].match(/RID = (.*)/)[1];
                var rtoe = +m[1].match(/RTOE = (.*)/)[1];
                if (!rid) {
                    dojo.byId('status_blast').innerHTML += 'Error: no job submitted';
                    return;
                }
                var count = 0;
                var wait_counter = 0;
                dojo.byId('status_blast').innerHTML += 'Search submitted...Estimated time ' + (Math.round(rtoe * 100 / 60) / 100) + ' minutes...';
                dojo.byId('waiting_blast').innerHTML = 'Waiting...';

                var waiting = setInterval(function () {
                    dojo.byId('waiting_blast').innerHTML = 'Waiting' + ('.'.repeat(wait_counter % 4));
                    wait_counter++;
                }, 700);

                var timer = setInterval(function () {
                    request(browser.config.blastURL 'https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=' + rid).then(function (data) {
                        count++;
                        if (count > 100) {
                            dojo.byId('status_blast').innerHTML = 'Error: timed out (requested status > 100 times)';
                            clearInterval(timer);
                            clearInterval(waiting);
                        }
                        var d = data.match(/QBlastInfoBegin([\s\S)]*?)QBlastInfoEnd/);
                        var stat = d[1].match(/Status=(.*)/)[1];
                        if (stat == 'UNKNOWN' || stat == 'WAITING') {
                            console.log('waiting', stat);
                        } else if (stat == 'READY') {
                            console.log('READY!', rid);
                            dojo.byId('status_blast').innerHTML = 'Ready';
                            clearInterval(timer);

                            var url = 'https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi?FORMAT_TYPE=JSON2&CMD=Get&RID=' + rid;
                            var oReq = new XMLHttpRequest();
                            oReq.open('GET', url, true);
                            oReq.responseType = 'arraybuffer';

                            oReq.onload = function (oEvent) {
                                var arrayBuffer = oReq.response; // Note: not oReq.responseText
                                if (arrayBuffer) {
                                    var zip = new JSZip();
                                    zip.loadAsync(arrayBuffer).then(function (file) {
                                        console.log(file);
                                        dojo.byId('waiting_blast').innerHTML = '';
                                        clearInterval(waiting);
                                        // new_zip.file("hello.txt").async("string"); // a promise of "Hello World\n"
                                    });
                                    return;
                                }
                            };
                            oReq.send(null);
                        }
                    }, function (error) {
                        console.error('Error checking status');
                        console.error(error);
                    });
                }, 5000);
            }, function (error) {
                console.error('Error doing BLAST');
                console.error(error);
            });
        }
    });
});
