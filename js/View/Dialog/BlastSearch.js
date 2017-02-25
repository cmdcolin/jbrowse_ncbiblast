define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/request',
    'dijit/focus',
    'dijit/form/Textarea',
    'JBrowse/View/Dialog/WithActionBar',
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
    on,
    Button
) {
    return declare(ActionBarDialog, {

        title: 'Search NCBI BLAST',

        constructor: function (args) {
            this.height = args.height || 100;
            this.browser = args.browser;
            this.setCallback    = args.setCallback || function () {};
            this.cancelCallback = args.cancelCallback || function () {};
            this.heightConstraints = { min: 10, max: 750 };
        },

        _fillActionBar: function (actionBar) {
            var res = '';
            var thisB = this;
            new Button({
                label: 'Search',
                onClick: dojo.hitch(this, function () {
                    thisB.searchNCBI(this.textarea.value);
                    this.setCallback && this.setCallback(res);
                    this.hide();
                })
            }).placeAt(actionBar);
            new Button({
                label: 'OK',
                onClick: dojo.hitch(this, function () {
                    this.setCallback && this.setCallback(res);
                    this.hide();
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

            this.textarea = new TextArea({
                id: 'blast_query'
            });

            this.set('content', [
                dom.create('label', { 'for': 'blast_query', innerHTML: '' }),
                this.textarea.domNode
            ]);

            this.inherited(arguments);
        },

        hide: function () {
            this.inherited(arguments);
            window.setTimeout(dojo.hitch(this, 'destroyRecursive'), 500);
        },

        searchNCBI: function (query) {
            request('https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi?DATABASE=nt&PROGRAM=blastn&CMD=Put&Query=' + query).then(function (res) {
                var m = res.match(/QBlastInfoBegin([\s\S)]*?)QBlastInfoEnd/);
                console.log(m[0]);
                var rid = m[1].match(/RID = (.*)/)[1];
                var count = 0;
                console.log(rid);

                var timer = setInterval(function () {
                    request('https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=' + rid).then(function (data) {
                        count++;
                        if (count > 100) {
                            clearInterval(timer);
                        }
                        var d = data.match(/QBlastInfoBegin([\s\S)]*?)QBlastInfoEnd/);
                        var stat = d[1].match(/Status=(.*)/)[1];
                        if (stat == 'UNKNOWN' || stat == 'WAITING') console.log('still waiting', stat, rid, count);
                        else if (stat == 'READY') {
                            console.log('READY!', rid);
                            clearInterval(timer);
                            request('https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi?FORMAT_TYPE=text&CMD=Get&RID=' + rid).then(function (blast) {
                                console.log(blast);
                            }, function (error) {
                                console.error('Failed to get BLAST results');
                                console.error(error);
                            });
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
