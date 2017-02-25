define([
    'dojo/_base/declare',
    'dijit/MenuItem',
    'dijit/Dialog',
    'JBrowse/Plugin',
    'NCBIBlast/View/Dialog/Search'
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
            this.initSearchMenu();
            this.searchNCBI();
        },

        initSearchMenu: function ()  {
            var thisB = this;
            this.browser.afterMilestone('initView', function () {
                setTimeout(function () {
                    if (!thisB.init) {
                        var blast = new MenuItem({
                            id: 'menubar_blast',
                            label: 'NCBI BLAST+',
                            onClick: function () {
                                new SearchDialog().show();
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
