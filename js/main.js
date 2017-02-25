require({
    packages: [
       { name: 'jszip', location: '../plugins/NCBIBLast/js/jszip/dist' }
    ]
},
[],
function () {
    define([
        'dojo/_base/declare',
        'dijit/MenuItem',
        'dijit/Dialog',
        'JBrowse/Plugin',
        'NCBIBlast/View/Dialog/BlastSearch'
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
                console.log('NCBIBlast plugin starting');
                var thisB = this;
                var browser = args.browser;
                browser.config.blastURL = 'https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi'
                browser.afterMilestone('initView', function () {
                    setTimeout(function () {
                        if (!thisB.init) {
                            var blast = new MenuItem({
                                id: 'menubar_blast',
                                label: 'NCBI BLAST+',
                                onClick: function () {
                                    new SearchDialog({}).show();
                                }
                            });
                            thisB.browser.addGlobalMenuItem('tools', blast);
                            thisB.browser.renderGlobalMenu('tools', { text: 'Tools' }, thisB.browser.menuBar);
                            // move Tool menu in front of Help menu
                            var toolsMenu = dijit.byId('dropdownbutton_tools');
                            var helpMenu = dijit.byId('dropdownbutton_help');
                            dojo.place(toolsMenu.domNode, helpMenu.domNode, 'before');
                            thisB.init = true;
                        }
                    }, 400);
                });
            }
        });
    });
});
