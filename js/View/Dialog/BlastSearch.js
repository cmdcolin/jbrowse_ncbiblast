define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/request',
    'dijit/focus',
    'dijit/form/Textarea',
    'dijit/form/Button',
    'JBrowse/View/Dialog/WithActionBar',
    'RemoteBlast/Store/NcbiBlast'
],
function (
    declare,
    array,
    request,
    focus,
    TextArea,
    Button,
    ActionBarDialog,
    NcbiBlast
) {
    return declare(ActionBarDialog, {

        title: 'Search NCBI BLAST',

        constructor: function (args) {
            this.height = args.height || 100;
            this.browser = args.browser;
            this.blastHandler = new NcbiBlast({ browser: this.browser });
            this.setCallback = args.setCallback || function () {};
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
                    thisB.blastHandler.cancel()
                    
                    this.cancelCallback && this.cancelCallback();
                    this.hide();
                })
            }).placeAt(actionBar);
        },

        show: function (callback) {
            dojo.addClass(this.domNode, 'blastDialog');

            this.textarea = dojo.create('textarea', {
                id: 'query_blast', style: {
                    width: '500px',
                    height: '200px'
                }
            });

            this.set('content', [
                dojo.create('label', { 'for': 'query_blast', innerHTML: '' }),
                this.textarea,
                dojo.create('p', { id: 'status_blast' }),
                dojo.create('p', { id: 'waiting_blast' }),
                dojo.create('div', { id: 'results_blast' })
            ]);

            this.inherited(arguments);
        },

        hide: function () {
            this.inherited(arguments);
            setTimeout(dojo.hitch(this, 'destroyRecursive'), 500);
        },

        searchNCBI: function (query) {
            var thisB = this;
            if (this.blastHandler.inProgress) {
                alert('Already in progress');
                return;
            }
            this.blastHandler.fetch(query, function (blastRes) {
                dojo.destroy('results_blast');
                var node = dojo.byId('results_blast');
                array.forEach(blastRes.hits, function (elt, iter) {
                    var cont = dojo.create('div', {
                        id: 'blast_res_' + iter,
                        style: {
                            background: '#bbb',
                            fontFamily: 'Courier',
                            padding: '10px'
                        }
                    }, node);
                    dojo.create('p', { innerHTML: 'Hit: ' + elt.description[0].accession + ' ' + elt.description[0].id }, cont);
                    dojo.create('p', { innerHTML: 'Species: ' + elt.description[0].sciname + ' ' + elt.description[0].taxid }, cont);
                    dojo.create('p', { innerHTML: 'Description: ' + elt.description[0].title }, cont);
                    dojo.create('pre', { innerHTML: elt.hsps[0].hseq + '\n' + elt.hsps[0].midline + '\n' + elt.hsps[0].qseq }, cont);
                });
                thisB.resize();
            }, function (rtoe, waitCounter) {
                dojo.byId('status_blast').innerHTML = 'Search submitted...Estimated time ' + (Math.round(rtoe * 100 / 60) / 100) + ' minutes...';
                dojo.byId('waiting_blast').innerHTML = 'Waiting' + ('.'.repeat(waitCounter % 4));
            }, function (error) {
                dojo.byId('status_blast').innerHTML = error;
                dojo.destroy('waiting_blast');
            });
        }
    });
});
