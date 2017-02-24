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
            this.searchNCBI();
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
                    dojo.place(toolsMenu.domNode, helpMenu.domNode, 'before');
                    thisB.init = true;
                }
                }, 400);
            })
        },

        searchNCBI: function() {
            request('https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi?QUERY=u00001&DATABASE=nt&PROGRAM=blastn&CMD=Put').then(function(res) {
                var m = res.match(/QBlastInfoBegin([\s\S)]*?)QBlastInfoEnd/);
                console.log(m[1]);
                var rid = m[1].match(/RID = (.*)/);
                var count = 0;

                var timer = setInterval(function() {
                    console.log('count',count)
                    
                    request('https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Get&FORMAT_OBJECT=SearchInfo&RID='+rid).then(function(data) {
                        count++;
                        if(count > 10) {
                            clearInterval(timer);
                        }
                        var d = data.match(/QBlastInfoBegin([\s\S)]*?)QBlastInfoEnd/);
                        var stat = d[1].match(/Status=(.*)/)[1];
                        if(stat=='UNKNOWN'||stat=='WAITING') console.log('still waiting',stat);
                        else if(stat=='READY') console.log('READY!')
                    }, function(error) {
                        console.error('Error checking status');
                        console.error(error);
                    });
                }, 20000)
            }, function(error) {
                console.error('Error doing BLAST');
                console.error(error);
            })
        }
    });
});
