// Override chained store to allow grouping
// Credits: https://www.sencha.com/forum/showthread.php?294029-Grid-does-not-work-with-chained-store-and-grouping-summary&p=1179427&viewfull=1#post1179427
Ext.override(Ext.data.ChainedStore, {
    getProxy: function() {
        return this.source.getProxy();
    }
});

//Ext.Loader.setConfig({ enabled: false });
//Ext.Loader.setPath('PveMgr', './pvemgr');
//Ext.require('PveMgr.view.SomeFormController');


Ext.application({
    name: 'PveMgr',
    requires: [
        //'PveMgr.model.Node',
        'PveMgr.model.DeployVmModel',
        'PveMgr.model.Vm',
        'PveMgr.model.VmSnapshot',
        'PveMgr.data.Proxy',
        'PveMgr.store.Vms',
        'PveMgr.store.VmTemplates',
        'PveMgr.store.Nodes',
        'PveMgr.store.Storages',
        'PveMgr.store.TaskLogs',
        'PveMgr.store.Realms',
        'PveMgr.store.Pools',
        'PveMgr.view.WsSelector',
        'PveMgr.view.VmGrid',
        'PveMgr.view.NodeGrid',
        'PveMgr.view.StorageGrid',
        'PveMgr.view.VmCreatorController',
        'PveMgr.view.ScriptedActionController',
        'PveMgr.view.VmBulkDeployController',
        'PveMgr.view.WorkspaceController',
        'PveMgr.view.QuotaEditController',
        'PveMgr.view.WorkspaceModel',
        'PveMgr.view.VmBulkDeployModel',
        'PveMgr.view.VmCreator',
        'PveMgr.view.ScriptedAction',
        'PveMgr.view.Workspace',
        'PveMgr.view.VmPanel',
        'PveMgr.view.VmBulkDeploy',
        'PveMgr.view.QuotaEdit',
        'PveMgr.view.Login',
    ],
    mainView: 'Workspace',
    controllers: ['AppController'],
    paths: {'PveMgr': './pvemgr'},
    //stores: ['PveMgr.data.Vms'],

    init: function() {

        if (window.location.hash === '#APIDEBUG') PveMgr.APIDEBUG = true;

        var urlapi = PveMgr.APIDEBUG ? '/api-debug' : '/api';

        Ext.state.Manager.setProvider(new Ext.state.CookieProvider());

        PveMgr.req = function(url, data, callback) {
            Ext.Ajax.request({
                timeout: 900000, // TODO: Configure and modify request parameters
                url: url,
                jsonData: data,
                success: function(resp, opts) {
                    let r;
                    try {
                        r = Ext.decode(resp.responseText);
                        if (r.success !== 1) throw new Error(r.errorMsg);
                    } catch (er) { // Backend application error
                        console.error('ОШИБКА серверного приложения.', er);
                        er.message = 'Ошибка серверного приложения. '
                            + er.message;
                        callback({success: false, err: er});
                        return;
                    }
                    callback(r);
                },
                failure: function(resp, opts) {  // Communication error
                    console.error('ОШИБКА ЗАПРОСА', resp, opts);
                    callback({
                        success: false,
                        err: new Error(
                            `Ответ: ${resp.statusText}, Статус: ${resp.status}`
                        ),
                    });
                },
            });
        };

        // opts = {vms: vms, users: users, misc:misc}
        PveMgr.deployVms = function(opts, callback) {
            PveMgr.req(
                'api/vmdeploy',
                opts,
                r => {
                    if (r && r.success !== false) {
                        console.log(r);
                        Ext.Msg.alert('Ответ сервера (деплой)',
                            '<pre>' + r.msg + '</pre>');
                    } else {
                        Ext.Msg.alert('Ошибка запроса', r.err.message);
                        console.error(r);
                    }
                    callback(r);
                });
        };

        PveMgr.rawData = function(store) {
            let rData = [];
            store.getData().each( function(item) {
                rData.push(item.getData());
            });
            return rData;
        };
        PveMgr.strIncrement = function(str, length) {
            let len = length || str.length;
            if (len === 0) return '';
            str = str * 1 + 1;
            return ("0".repeat(len-1) + str).slice(-len);
        };

        PveMgr.toast = function(message, title, align, iconcls) {
            title?  console.log('Toast', title, message)
                 :  console.log('Toast', message);
            Ext.toast( message, title, align, iconcls );
        };

        PveMgr.qagentAction = function(vm, action, data, callback) {
            PveMgr.req( urlapi + '/qagentaction', {
                action,
                data,
                vmid: vm.vmid,
                node: vm.node,
            }, callback );
        };

        PveMgr.comboLoadOnce = function(combo, store) {
            if (store.getData().getAt(0)) {
                combo.select(store.getData().getAt(0));
                combo.fireEvent('select', combo);
            } else {
                store.on(
                    'load',
                    function(store, records, success) {
                        if (success) {
                            combo.select(store.getData().getAt(0));
                            store.un('load', arguments.callee, store);
                            combo.fireEvent('select', combo);
                        }
                    },
                    store
                );
            }
        };

        PveMgr.vmSnapshots = function(opts, callback) {
            PveMgr.req(
                urlapi + '/vmsnapshots',
                opts,
                callback
            );
        };
    },

    launch:function(){
//
// <Testing>
//
        //console.log(Ext.create('MyWidget').up());
        // Test application readiness
        console.log('Ext', Ext);
        Ext.getDoc().dom.title = 'PveMgr';  
        console.log('PveMgr', PveMgr);
        //console.log('Query Panels', Ext.ComponentQuery.query('panel'));
        //~ Ext.Ajax.request({
            //~ url: 'test',
            //~ success: function(response, opts) {
                //~ var obj = Ext.decode(response.responseText);
                //~ //console.log(Ext.getCmp('wsSelectorWest').getComponent('nodes'));
                //~ Ext.getCmp('wsSelectorWest').getComponent('nodes')
                    //~ .setHtml('<pre>' + obj[0] + '</pre>');
            //~ },
            //~ failure: function(response, opts) {
                //~ console.log('server-side failure with status code '
                    //~ + response.status);
            //~ },
        //~ });
//
// </Testing>
//

        //~ Ext.Ajax.request({
            //~ url: 'api/meta',
            //~ success: function(response, opts) {
                //~ var obj = Ext.decode(response.responseText);
                //~ let vmodel = PveMgr.getApplication().getMainView().getViewModel();
                //~ vmodel.set('loggedUser', obj.data.userId);
            //~ },
            //~ failure: function(response, opts) {
                //~ console.error('server-side failure with status code '
                    //~ + response.status);
            //~ }
        //~ });

    },
    listen : {
        controller : {
            '#' : {
                unmatchedroute : function() {
                   console.log('unmatchedroute', arguments) //'onUnmatchedRoute'
                },
            },
        },
    },
});
