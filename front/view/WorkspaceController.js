Ext.define('PveMgr.view.WorkspaceController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pvemgr.workspace',
    itemId: 'wscontroller',
    id: 'wscontroller', // Useful for debug


    init: function() {
        let me = this;
        let sp = Ext.state.Manager.getProvider();

        Ext.getStore('vmStore').load();
        Ext.getStore('storageStore').load();
        Ext.getStore('poolStore').load();
        Ext.getStore('taskLogStore').load();
        Ext.getStore('nodeStore').load();
        Ext.Ajax.on('requestexception', function(conn, response, options) {
            if (response.status == 401) { // auth failure
                me.showLogin();
                sp.clear('loggedUser');
            }
        });

        sp.on('statechange', function(sProv, param, value) {
            if (param == 'loggedUser') {
                me.getViewModel().set( 'loggedUser', value );
            }
        } );
        me.getViewModel().set( 'loggedUser', sp.get('loggedUser') );
    }, // </init>


    listen: {
        //~ controller: {
            //~ '#': {
                //~ unmatchedroute: function() {console.log('unmathed in workspace', arguments);},
            //~ },
        //~ },

        store: {
            '#vmStore': {
                load: function(store, records, successful, operation) {
                    if (successful) {
                        let vm = this.getViewModel();
                        let data = store.getProxy().getReader().rawData.data
                            .sort((a, b) => a.vmid - b.vmid);
                        vm.set('vmData', data);
                    } else {
                        if (operation.error.status == 401);
                        this.on( 'pmgrlogin', 'load', store, {single: true} );
                    }
                },
            },
            '#vmGridStore': {
                groupchange: function(store, grouper) {
                    let g = grouper ? grouper.getProperty() : false;
                    this.getViewModel()
                        .set('vmGridGroupBy', g);
                },
            },
            '#nodeStore': {
                load: function(store, records, successful, operation) {
                    if (successful) {
                        let vm = this.getViewModel();
                        vm.set('nodeData', store.getProxy().getReader().rawData.data);
                    } else {
                        if (operation.error.status == 401);
                        this.on( 'pmgrlogin', 'load', store, {single: true} );
                    }
                },
            },
            '#storageStore': {
                load: function(store, records, successful, operation) {
                    if (successful) {
                        let vm = this.getViewModel();
                        let data = store.getProxy().getReader().rawData.data
                            .sort((a, b) => a.storage.localeCompare(b.storage));
                        vm.set('storageData', data);
                    } else {
                        if (operation.error.status == 401);
                        this.on( 'pmgrlogin', 'load', store, {single: true} );
                    }
                },
            },
            '#taskLogStore': {
                load: function(store, records, successful, operation) {
                    if (!successful && operation.error.status == 401) {
                        this.on( 'pmgrlogin', 'load', store, {single: true} );
                    }
                },
            },
            '#poolStore': {
                load: function(store, records, successful, operation) {
                    if (!successful && operation.error.status == 401) {
                        this.on( 'pmgrlogin', 'load', store, {single: true} );
                    }
                },
            },
        }, // </store>

    }, // </listen>


    showLogin: function() {
        let vModel = this.getViewModel();
        let login = vModel.get('login');
        if (!login) {
            login = Ext.create('PveMgr.view.Login');
            vModel.set( 'login', login );
        }
        login.show();
    },
    wsSelectMainView: function(tabPanel, newCard) {
        this.lookupReference('wsCenter').setActiveItem(newCard.getItemId());
    },
    onAddWindow: function(sender, record) {
        Ext.Msg.alert('Add Window', 'Add a new window here.');
    },

    //~ myOnRender: function(choice) {
        //~ Ext.Msg.alert('Add Tab', 'Add a new tab here. My Viewport Event');
    //~ },

    onCloneVm: function() {
        let vmGrid = this.lookupReference('vmGrid');
        if(!vmGrid.selection){
            PveMgr.toast('Необходимо выбрать ВМ', 'Ошибка');
            return;
        }
        let data = vmGrid.getSelection()[0].data;
        let vmCrForm = this.lookupReference('vmCreator').getForm();
        let ip, mask;
        [ip, mask] = data.ip ? data.ip.split('/') : [];
        vmCrForm.setValues({
            hostname: data.name,
            name: data.name,
            vmid: data.vmid,
            ip: ip,
            mask: mask,
            description: data.config.description,
        });
    },

    onLogFileSelect: function(grid, selection) {
        if(!selection.length) return;
        let taskLog = this.lookupReference('taskLog');
        taskLog.setHtml("Обновление...");
        Ext.Ajax.request({
            url: "api/tasklogs/" + selection[0].data.name,
            success: function(response, opts) {
                var resp = response.responseText;
                taskLog.setHtml("<pre>"+ resp + "</pre");
            },
            failure: function(response, opts) {
                console.log('server-side failure with status code '
                    + response.status);
            }
        });
    },

    updateTaskLogs: function() {
        this.lookupReference('taskLogs').getStore().load();
    },

    updateVMs: function() {
        Ext.getStore('vmStore').load();
    },

    onVmGroupingSelect: function(component, record) {
        let store = this.lookupReference('vmGrid').getStore(); // Chained store
        record.data.value ?
            store.group(record.data.value)
            : store.clearGrouping();
    },

    getVmAddress: function() {
        let vmGrid = this.lookupReference('vmGrid');
        let selection = vmGrid.getSelection();
        if(!selection.length){
            PveMgr.toast('Необходимо выбрать ВМ', 'Ошибка');
            return;
        }
        let data = selection[0].getData();
        if(data.status !== 'running'){
            PveMgr.toast('ВМ не запущена', 'Ошибка');
            return;
        }
        PveMgr.req(
            {url: "api/cmd"},
            {
                cmd: 'getaddress',
                params: { vmid: data.vmid, node: data.node }
            },
            function(resp) {
                if(resp.success) PveMgr.toast(resp.msg);
                else PveMgr.toast(resp.err.message);
            }
        );
    },

    vmGridStart: function(view, rowInd, colInd, item, event, record) {
        let vc = this;
        let d = record.getData();
        Ext.MessageBox.confirm('Старт ВМ ' + d.vmid, 'Подтверждаете старт ВМ'
                + d.vmid + ' (' + d.name + ')?', function(btn){
           if(btn === 'yes'){
               vc.vmAction(d.vmid, 'start', d.node);
           }
        }).setIconCls('x-fa fa-play');
    },

    vmGridStop: function(view, rowInd, colInd, item, event, record) {
        let vc = this;
        let d = record.getData();
        Ext.MessageBox.confirm('Остановить ' + d.vmid, 'Подтверждаете остановку ВМ'
                + d.vmid + ' (' + d.name + ')?', function(btn){
           if(btn === 'yes'){
               vc.vmAction(d.vmid, 'stop', d.node);
           }
        }).setIconCls('x-fa fa-stop');
    },

    vmGridDelete: function(view, rowInd, colInd, item, event, record) {
        let vc = this;
        let d = record.getData();
        Ext.MessageBox.confirm('Удалить ' + d.vmid, 'Подтверждаете удаление ВМ'
                + d.vmid + ' (' + d.name + ')?', function(btn){
           if(btn === 'yes'){
               vc.vmAction(d.vmid, 'delete', d.node);
           }
        }).setIconCls('x-fa fa-times');
    },

    vmAction: function(vmid, action, node) {
        Ext.Ajax.request({
            url: "api/vmaction",
            method: 'GET',
            params: {vmid: vmid, action: action, node},
            success: function(response, opts) {
                let resp = Ext.decode(response.responseText);
                if (resp.success === 1){
                    Ext.Msg.alert("Ответ сервера", resp.data.msg);
                } else {
                    Ext.Msg.alert("ОШИБКА",
                        resp.errorMsg.replace("\n", '<br>')
                    );
                }
            },
            failure: function(response, opts) {
                console.log('server-side failure with status code '
                    + response.status);
            }
        });
    },

    vmTreeSelect: function(selection, record, index) {
        let vmGrid = this.lookupReference('vmGrid');
        let store = vmGrid.getStore();  // Using chained store for filtering
        store.clearFilter();
        if (record.isLeaf()) {
            this.gotoVm(record.data.vmid);
            // Hack to return focus because can't select without focus in the first place
            //~ this.lookupReference('vmsSelector').getView().focusRow(index);
        } else {
            store.filter([{
                property: this.getViewModel().get('vmTreeGroupBy'),
                value: record.getData().text,
                exactMatch: true,
            }]);
        };
    },

    wsSelectorFilter: function(field, newVal, oldVal) {
        let store = this.lookupReference('wsSelector').getActiveTab().getStore();
        store.clearFilter();
        if (!newVal) return;
        store.setConfig('filterer', 'bottomup');
        store.filter({
            property: 'text',
            value: newVal,
            anyMatch: true,
        });
    },

    onVmFromStorage: function(grid, rowIndex, colIndex) {
        let vmid = grid.getStore().getAt(rowIndex).get('vmid');
        let vmGrid = this.lookupReference('vmGrid');
        let storeNum = vmGrid.getStore().find('vmid', vmid);
        this.gotoVm(vmid);
    },

    onStorageFromVm: function(grid, rowIndex, colIndex) {
        let storage = grid.getStore().getAt(rowIndex).get('storage');
        let node = grid.getStore().getAt(rowIndex).get('node');
        this.gotoStorage(storage, node);
    },

    gotoVm: function(vmid) {
        let wsSelector = this.lookupReference('wsSelector');
        if (wsSelector.getActiveTab().getItemId != 'vms'){
            wsSelector.setActiveTab('vms');
        }
        let vmGrid = this.lookupReference('vmGrid');
        let storeNum = vmGrid.getStore()
            .find('vmid', vmid, 0, false, true, true);
        //~ vmGrid.getView().focusRow(storeNum);
        //~ vmGrid.getSelectionModel().select(storeNum);      
        vmGrid.ensureVisible( storeNum, {
            highlight: true,
            select: true,
            animate: true
        });
    },

    gotoStorage: function(storage, node) {
        let wsSelector = this.lookupReference('wsSelector');
        let strgGrid = this.lookupReference('storageGrid');
        let store = strgGrid.getStore();
        let storeNum;
        store.clearFilter();
        if (node !== undefined) {
            store.filter('storage', storage);
            storeNum = strgGrid.getStore()
                .find('node', node, 0, false, true, true);
            if (storeNum === -1) {
                storeNum = strgGrid.getStore().findBy( function(record) {
                    return record.getData().nodearray.indexOf(node) !== -1
                });
            }
        } else {
            storeNum = strgGrid.getStore().find('storage', storage, 0, false, true, true);
        }
        if (storeNum != -1) {
            if (wsSelector.getActiveTab().getItemId != 'storages'){
                wsSelector.setActiveTab('storages');
            }
            strgGrid.getView().focusRow(storeNum);
            strgGrid.getSelectionModel().select(storeNum);      
        } else {
            PveMgr.toast(`Хранилище ${storage} не найдено${node? ' на узле ' + node : ''}`);
        }
        store.clearFilter();
    },

    vmPanelShellExec: function (inFld, outPanel) {

        const cmd = inFld.getValue();
        const text = outPanel.body.dom.textContent
                   + '\nКоманда: ' + cmd + "\nЗапрос отправлен";
        outPanel.update(text);
        const d = outPanel.body.dom;
        d.scrollTop = d.scrollHeight - d.offsetHeight;
        inFld.setValue('');
        const vmrecord = inFld.lookupViewModel()
            .get('record').getData();
        PveMgr.qagentAction(
            vmrecord,
            'shellexec',
            {cmd},
            function(resp) {
                let text = outPanel.body.dom.textContent;
                if (resp.success) {
                    if (resp.data.error) {
                        text += '\nQEMU Agent error:\n' + Ext.encode(resp.data.error);
                    }
                    if (resp.data.return && resp.data.return['out-data']) {
                        const out = Ext.util.Base64.decode(resp.data.return['out-data']);
                        text += '\nSTDOUT:\n' + out;
                    }
                    if (resp.data.return && resp.data.return['err-data']) {
                        const err = Ext.util.Base64.decode(resp.data.return['err-data']);
                        text += '\nSTDERR:\n' + err;
                    }
                    text += '\nКоманда: "' + cmd + '" завершена';
                    outPanel.update(text);
                    // Add 100 workaround horizontal scrollbar height 
                    // TODO: Verify in different browsers
                    d.scrollTop = d.scrollHeight - d.offsetHeight + 100;
                } else if (resp.err) {
                    PveMgr.toast(resp.err.message, "Ошибка");
                } else {
                    PveMgr.toast('Неопределённая ошибка', 'Ошибка');
                }
            }
        );
    },

    vmPanelShellKey: function( inFld, e, eOpts ) {
        const form = inFld.up();
        const codePalnel = form.up().prevChild(form);

        if (e.getKey() === e.ENTER) {
            this.vmPanelShellExec(inFld, codePalnel);
        } else if (e.getKey() === e.PAGE_UP) {
            codePalnel.scrollBy(0, -0.9*codePalnel.getHeight(), false);
            e.stopEvent();
        } else if (e.getKey() === e.PAGE_DOWN) {
            codePalnel.scrollBy(0, 0.9*codePalnel.getHeight(), false);
            e.stopEvent();
        }
    },
    vmPanelShellClick: function( btn, e, eOpts ) {
        const form = btn.up();
        const codePalnel = form.up().prevChild(form);
        const inFld = form.prevChild(btn);

        this.vmPanelShellExec(inFld, codePalnel);
    },

    test: function() {
        let vmGrid = this.lookupReference('vmGrid');
        let selection = vmGrid.getSelection();
        if(!selection.length){
            PveMgr.toast('Необходимо выбрать ВМ', 'Ошибка');
            return;
        }
        let vmid = selection[0].getData().vmid;
        PveMgr.req(
            {url: "api/test"},
            { vmid: selection[0].getData().vmid },
            function(resp) {
                console.log(resp);
                if(resp.success) PveMgr.toast(JSON.stringify(resp));
                else PveMgr.toast(resp.err.message);
            }
        );
    },

    vmPanelGetSnaps: function(panel) {
        const treePanel = panel.getComponent('snapTree'); // Working on treepanel with snapshots
        const vModel = treePanel.lookupViewModel();
        const vmdata = vModel.getData().record.data;
        PveMgr.vmSnapshots(
            {
                snapAction: 'get',
                vmid: vmdata.vmid,
                node: vmdata.node,
            },
            function(resp) {
                let snaps = resp.data;
                let root = {
                    expanded: true,
                };

                root.children = snaps.filter( s => !s.parent );

                // Converting list to tree
                root.children.forEach( function maketree (p) {
                    let chldrn = [];
                    let notChldrn = [];
                    snaps.forEach( (s, i) => {
                        if ( s && s.parent === p.name ) {
                            chldrn.push(s);
                        } else {
                            notChldrn.push(s);
                        }
                    } );
                    if (chldrn.length) {
                        p.children = chldrn;
                        p.expanded = true;
                        p.expandable = false;
                    } else {
                        // Ext JS bug here. If there is no children, and only one leaf in tree
                        // with invisible root, the error happens when collapsing VM rowidget
                        // with open snapshot tab
                        // TODO: report or workaround
                        p.leaf = true;
                    }
                    if (p.name === 'current') p.iconCls = 'x-fa fa-desktop';
                    else p.iconCls = 'x-fa fa-history';
                    snaps = notChldrn;
                    chldrn.forEach(maketree);
                } );

                treePanel.setRootNode(root);
            }
        );
    },

    vmPanelSnapBtnClick: function(btn) {
        btn.disable(true);
        const vc = this;

        Ext.MessageBox.confirm(
            'Требуется подтверждение',
            'Подтверждение действия "' + btn.getText() + ' снэпшот"',

            confirm => {

                if ( confirm === 'yes' ) {
                    const snaptab = btn.up('[itemId=snapTab]');     // Alternative Ext JS selector '#snapTab'
                    vc.vmPanelSnapOps(
                        snaptab,
                        btn.getItemId(),
                        () => btn.enable(true)
                    );
                    setTimeout( () => btn.enable(true), 10000 );    // enable anyway if something goes wrong
                }

            }).setIconCls('x-fa fa-play');
    },

    // Create, modify, rollback or delete snaphot, given treepanel with optionaly selected snapshot
    vmPanelSnapOps: function(snaptab, op, callback) {
        const controller = this;
        const treepanel = snaptab.getComponent('snapTree');
        const opts = {snapAction: op};

        if ( ['del', 'rollback'].indexOf(op) > -1 ) {
            const selection = treepanel.getSelection();
            if(!selection.length){
                PveMgr.toast('Необходимо выбрать снэпшот', 'Ошибка');
                return;
            }
            opts.snapname = selection[0].getData().name;
        }
        if ( ['takenew', 'modify'].indexOf(op) > -1 ) {
            const data = snaptab.getComponent('snapCtrl').getValues();

            opts.snapname    = data.name;
            opts.description = data.description;
            opts.vmstate     = data.vmstate;
        }


        const vmdata = treepanel.lookupViewModel().get('record').getData();
        opts.vmid = vmdata.vmid;
        opts.node = vmdata.node;

        PveMgr.vmSnapshots(opts,
            function(resp) {
                if (resp.success) {
                    // Timeout to let task complete
                    // TODO: implement task progress monitoring: Take Task ID and verify periodically until it completes
                    // TODO: In backand probably. Or in borh *ends
                    setTimeout( () =>
                        controller.vmPanelGetSnaps(treepanel.up())
                    , 5000);
                    PveMgr.toast(resp.msg , 'Задача запущена');
                }
                else {
                    Ext.Msg.alert('Error', resp.err.message);
                }
                if (callback, callback(resp));
            }
        );
    },

}); // </PveMgr.view.WorkspaceController>
