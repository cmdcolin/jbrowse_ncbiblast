define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/request',
    'dojo/on',
    'dijit/form/Button',
    'JBrowse/View/Dialog/WithActionBar',
    'JBrowse/Model/Location',
    'RemoteBlast/Store/NcbiBlast'
],
function (
    declare,
    array,
    request,
    on,
    Button,
    ActionBarDialog,
    Location,
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
                    thisB.blastHandler.cancel();

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
                dojo.create('p', { 'innerHTML': 'Search NCBI BLAST ' + thisB.browser.config.blastDB }),
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
                dojo.byId('waiting_blast').innerHTML = 'Already in progress';
                return;
            }
            this.blastHandler.fetch(query, function (blastRes) {
                dojo.byId('status_blast').innerHTML = 'Finished';
                dojo.empty('results_blast');
                var node = dojo.byId('results_blast');
                array.forEach(blastRes.hits, function (elt, iter) {
                    var e = elt.description[0];
                    if (+e.taxid === +thisB.browser.config.taxid) {
                        var cont = dojo.create('div', {
                            id: 'blast_res_' + iter,
                            style: {
                                background: '#bbb',
                                fontFamily: 'Courier',
                                padding: '10px'
                            }
                        }, node);
                        dojo.create('p', { innerHTML: 'Hit: ' + e.accession + ' ' + e.id }, cont);
                        dojo.create('p', { innerHTML: 'Species: ' + e.sciname + ' ' + e.taxid }, cont);
                        dojo.create('p', { innerHTML: 'Description: ' + e.title }, cont);

                        var refs = e.id.split('|');
                        var transId = refs[3];


                        array.forEach(elt.hsps.slice(0, 10), function (hsp, jter) {
                            request('http://rest.ensembl.org/map/cdna/' + transId + '/' + hsp.hit_from + '..' + hsp.hit_to + '?content-type=application/json', {
                                handleAs: 'json'
                            }).then(function (results) {
                                var mr = results.mappings[0];
                                var ref = dojo.create('a', { innerHTML: 'chr' + mr.seq_region_name + ':' + mr.start + '..' + mr.end, href: '#' }, cont);
                                on(ref, 'click', function () {
                                    thisB.browser.callLocation(new Location({ ref: 'chr' + mr.seq_region_name, start: mr.start, end: mr.end }));
                                });
                                dojo.create('div', {
                                    innerHTML: 'HSP' + jter + '\n' + hsp.hseq + '\n' + hsp.midline + '\n' + hsp.qseq,
                                    style: {
                                        background: '#aaa',
                                        margin: '5px'
                                    }
                                }, cont);
                            });
                        });
                    }
                });
            }, function (rtoe, waitCounter) {
                dojo.byId('status_blast').innerHTML = 'Search submitted...Estimated time ' + (Math.round(rtoe * 100 / 60) / 100) + ' minutes...';
                dojo.byId('waiting_blast').innerHTML = 'Waiting' + ('.'.repeat(waitCounter % 4));
            }, function (msg, error) {
                dojo.byId('status_blast').innerHTML = msg + '<br />' + error;
                console.error(msg, error);
                dojo.empty('waiting_blast');
            });
        }
    });
});
