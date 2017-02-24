define([
    'dojo/_base/declare',
    'dojo/request',
    'dijit/MenuItem',
    'dijit/registry',
    'JBrowse/Plugin'
],
function(
    declare,
    request,
    dijitMenuItem,
    dijitRegistry,
    JBrowsePlugin
) {
    return declare(JBrowsePlugin, {
        constructor: function(/* args */) {
            console.log('NCBIBlast plugin starting');
            this.initSearchMenu();
        },

        initSearchMenu: function()  {
            var thisB = this;
            this.browser.afterMilestone('initView', function() {
                setTimeout(function() {
                if (! thisB.init) {
                    var blast = new dijitMenuItem({
                        id: 'menubar_blast',
                        label: 'NCBI BLAST+',
                        onClick: function() {
                            thisB.searchNCBI();
                        }
                    });
                    thisB.browser.addGlobalMenuItem('tools', blast);
                    thisB.browser.renderGlobalMenu('tools', { text: 'Tools' }, thisB.browser.menuBar );
                    // move Tool menu in front of Help menu
                    var toolsMenu = dijit.byId('dropdownbutton_tools');
                    var helpMenu = dijit.byId('dropdownbutton_help');
                    console.log(toolsMenu)
                    dojo.place(toolsMenu.domNode, helpMenu.domNode, 'before');
                    thisB.init = true;
                }
                }, 1000);
            })
        },

        searchNCBI: function() {
            request('https://blast.ncbi.nlm.nih.gov/Blast.cgi').then(function() {
            }, function() {
            })
        }
    });
});
