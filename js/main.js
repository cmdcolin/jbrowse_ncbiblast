require({
    packages: [
       { name: 'jszip', location: '../plugins/RemoteBlast/js/jszip/dist' }
    ]
},
[],
function () {
    define([
        'dojo/_base/declare',
        'dijit/MenuItem',
        'dijit/Dialog',
        'JBrowse/Plugin',
        'RemoteBlast/View/Dialog/BlastSearch'
    ],
    function (
        declare,
        MenuItem,
        Dialog,
        JBrowsePlugin,
        SearchDialog
    ) {
        return declare(JBrowsePlugin, {
            constructor: function (/* args */) {
                console.log('RemoteBlast plugin starting');
                var thisB = this;
                this.browser.config.blastURL = this.browser.config.blastURL || 'https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi';
                this.browser.config.blastDB = this.browser.config.blastDB || 'nt';
                this.browser.afterMilestone('initView', function () {
                    // hack to make sure that menu gets initialized
                    setTimeout(function () {
                        var blast = new MenuItem({
                            id: 'menubar_blast',
                            label: 'Search Remote BLAST',
                            onClick: function () {
                                new SearchDialog({ browser: thisB.browser }).show();
                            }
                        });
                        var toolsMenu = dijit.byId('dropdownbutton_tools');
                        var helpMenu = dijit.byId('dropdownbutton_help');
                        thisB.browser.addGlobalMenuItem('tools', blast);
                        if (!toolsMenu) {
                            thisB.browser.renderGlobalMenu('tools', { text: 'Tools' }, thisB.browser.menuBar);
                            toolsMenu = dijit.byId('dropdownbutton_tools');
                        }
                        // move Tool menu in front of Help menu
                        dojo.place(toolsMenu.domNode, helpMenu.domNode, 'before');
                    }, 400);
                });
            }
        });
    });
});
