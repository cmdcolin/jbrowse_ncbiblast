define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/request',
    'dojo/on',
    'dijit/form/Button',
    'JBrowse/View/Dialog/WithActionBar',
    'RemoteBlast/Store/NcbiBlast'
],
function (
    declare,
    array,
    request,
    on,
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
            var thisB = this;
            dojo.addClass(this.domNode, 'blastDialog');

            this.textarea = dojo.create('textarea', {
                id: 'query_blast', style: {
                    width: '500px',
                    height: this.height + 'px'
                }
            });

            this.set('content', [
                dojo.create('p', { 'innerHTML': 'Search NCBI BLAST '+thisB.browser.config.blastDB }),
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
                dojo.byId('status_blast').innerHTML = 'Finished';
                dojo.empty('results_blast');
                var node = dojo.byId('results_blast');
                console.log('here',blastRes)
                array.forEach(blastRes.hits, function (elt, iter) {
                    console.log('here',elt)
                    var cont = dojo.create('div', {
                        id: 'blast_res_' + iter,
                        style: {
                            background: '#bbb',
                            fontFamily: 'Courier',
                            padding: '10px'
                        }
                    }, node);
                    var e = elt.description[0];
                    dojo.create('p', { innerHTML: 'Hit: ' + e.accession + ' ' + e.id }, cont);
                    dojo.create('p', { innerHTML: 'Species: ' + e.sciname + ' ' + e.taxid }, cont);
                    dojo.create('p', { innerHTML: 'Description: ' + e.title }, cont);
                    
                    
                    array.forEach(elt.hsps.slice(0,10), function(hsp, jter) {
                        if(hsp.taxid == thisB.browser.config.taxid) {
                            console.log('here',hsp);
                            var ref = dojo.create('a', { innerHTML: '1:'+hsp.hit_from+'..'+hsp.hit_to, href: '#' }, cont);
                            on(ref, 'click', function() {
                                thisB.browser.callLocation(new Location({ ref: '1', start: hsp.hit_from, end: hsp.hit_to }));
                            });
                        }
                        
                        dojo.create('div', {
                            innerHTML: 'HSP'+jter+'\n'+hsp.hseq + '\n' + hsp.midline + '\n' + hsp.qseq,
                            style: {
                                background: '#aaa'
                            }
                        }, cont);
                    });
                });
            }, function (rtoe, waitCounter) {
                dojo.byId('status_blast').innerHTML = 'Search submitted...Estimated time ' + (Math.round(rtoe * 100 / 60) / 100) + ' minutes...';
                dojo.byId('waiting_blast').innerHTML = 'Waiting' + ('.'.repeat(waitCounter % 4));
            }, function (error) {
                dojo.byId('status_blast').innerHTML = error;
                dojo.empty('waiting_blast');
            });
        }
    });
});
