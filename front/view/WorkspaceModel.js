// Copyright (c) 2018 Medindex (medindex.ru)

Ext.define('PveMgr.view.WorkspaceModel', {
    extend: 'Ext.app.ViewModel',

    alias: 'viewmodel.pvemgr.ws',

    data: {
        footerTitle: 'Статус операций',
        centerTitle: 'PveMgr',
        activeView: 2,
        loggedUser: null,
        config: [
            {agent: 'aaa'},
        ],

        vmData: [],
        nodeData: [],
        storageData: [],

        vmTreeGroupBy: 'pool',
        vmGridGroupBy: false,
        storageTreeGroupBy: 'type',
        scriptedActionsData: [
            {
                name: 'dopve',
                description: 'Тестовый кластер Proxmox',
                params: [
                    {
                        fieldLabel: 'Первая ВМ',
                        name: 'firstvm',
                        text: 'first',
                        xtype: 'numberfield',
                        value: 21,
                    },{
                        fieldLabel: 'Последняя ВМ',
                        name: 'lastvm',
                        text: 'last',
                        xtype: 'numberfield',
                        value: 24,
                    },{
                        fieldLabel: 'Ceph',
                        xtype: 'checkbox',
                        name: 'ceph',
                        inputValue: 1,
                        uncheckedValue: 0,
                    },
                ],
            },{
                name: 'testaction01',
                description: 'Тестовый скрипт 1',
                params: [
                    {fieldLabel: 'param1', value: 'oner'},
                    {fieldLabel: 'param2', value: 'twoer'},
                    {fieldLabel: 'param3', value: 'threeer'},
                ],
            },{
                name: 'testsleep',
                description: 'Поспать',
                params: [
                    {
                        fieldLabel: 'Продолжительность',
                        name: 'duration',
                        value: 10,
                    },
                ],
            },{
                name: 'testaction02',
                description: 'Тестовый скрипт 2',
                params: [
                    {fieldLabel: 'param11', value: '9oner'},
                    {fieldLabel: 'param21', value: '9twoer'},
                    {fieldLabel: 'param31', value: '9threeer'},
                    {
                        fieldLabel: 'param31',
                        value: '9threeer',
                        xtype: 'combo',
                        store: {
                            fields: [
                                'text',
                            ],
                            data:[
                                {text: '123'},
                                {text: '456'},
                                {text: '123456'},
                                {text: 'Еще параметр'},
                            ],
                        },
                    },
                ],
            },
        ],
        scriptedActionsSelected: 'dopve',
    },

    formulas: {
        name: function(get) {
            var fn = get('firstName'), ln = get('lastName');
            return (fn && ln) ? (fn + ' ' + ln) : (fn || ln || '');
        },
        loggedString: function(get) {
            let u = get('loggedUser');
            return u ? 'Учетная запись: ' + u : 'Вы не авторизованы';
        },
        //~ formulaScriptedActions: function(get) {
            //~ let a = get('scriptedActionsData');
            //~ let s = get('scriptedActionsSelected');
            //~ return a[s];
        //~ },
        formulaVmTree: function(get) { // returns rootNode
            let data = get('vmData');
            let groupBy = get('vmTreeGroupBy');
            let root = {expanded: true, children: []};
            if (!groupBy) {
                //data.sort((a, b) => a.vmid - b.vmid).forEach(d => {
                data.forEach(d => {
                    root.children.push({
                        text: d.vmid + ' (' + d.name + ')',
                        iconCls: 'x-fa fa-desktop',
                        leaf: true,
                        vmid: d.vmid,
                    })
                });

            } else {
                grpFields = [... new Set(data.map(d => d[groupBy]))]; // getting unique groupping fields
                grpFields.sort((a, b) => a.localeCompare(b));
                grpFields.forEach((g, i) => {
                    root.children.push({
                        text: g,
                        expanded: !i,
                        iconCls: 'x-fa fa-server',
                        children: data.filter(el => el[groupBy] == g)
                            .map(el => ({
                                text: el.vmid + ' (' + el.name + ')',
                                leaf: true,
                                iconCls: 'x-fa fa-desktop',
                                vmid: el.vmid,
                            })),
                    });
                });
            }
            return root;
        },
        formulaNodeTree: function(get) { // returns rootNode
            let data = get('nodeData');
            let root = {expanded: true, children: []};
            grpFields = [... new Set(data.map(d => d['cluster']))];
            grpFields.forEach((g, i) => {
                root.children.push({
                    text: g,
                    expanded: !i,
                    iconCls: 'x-fa fa-server',
                    children: data.filter(el => el.cluster == g)
                        .map(el => ({
                            text: el.node + ' (' + el.ip + ')',
                            leaf: true,
                            iconCls: 'x-fa fa-desktop',
                            node: el.node,
                        })),
                });
            });
            return root;
        },
        formulaStorageTree: function(get) { // returns rootNode
            let data = get('storageData');
            let newdata = [];
            let groupBy = get('storageTreeGroupBy');
            let root = {expanded: true, children: []};
            if (!groupBy) {
                data.forEach(d => {
                    root.children.push({
                        text: d.storage + ' (' + d.name + ')',
                        iconCls: 'x-fa fa-database',
                        leaf: true,
                        storage: d.storage,
                    })
                });
            } else {
                if ( ['node', 'storage'].indexOf(groupBy) != -1 ) {
                    data.forEach( d => {
                        d.resources.forEach( r => {
                            newdata.push(Object.assign({}, r, d));
                        });
                    });
                    data = newdata;
                }
                grpFields = [... new Set(data.map(d => d[groupBy]))];
                grpFields.forEach((g, i) => {
                    root.children.push({
                        text: g,
                        expanded: !i,
                        iconCls: 'x-fa fa-server',
                        children: data.filter(el => el[groupBy] == g)
                            .map(el => ({
                                text: el.storage + ' ( '
                                    + el.type
                                    + (el.node ? ' | ' + el.node : '') + ' )',
                                leaf: true,
                                iconCls: 'x-fa fa-database',
                                storage: el.storage,
                                type: el.type
                            })),
                    });
                });
            }
            return root;
        },
        formulaStorageTreeGrid: function(get) { // returns rootNode
            let data = get('storageData');
            console.log(data);
            let root = {expanded: true, storage: 'DUMMY_ROOT', children: []};
            data.forEach(el => {
                console.log(el);
                let vmStore = Ext.create('Ext.data.ChainedStore', {
                        source: 'vmStore',
                        filters: [
                            function(m) {
                                let dA = m.getData().diskarray;
                                if (!dA) return;
                                return (dA.map(d => d.storage).indexOf(el.storage) != -1);
                            },
                        ],
                });
                let d = Object.assign({}, el);
                if (d.shared == 1) {
                    let disk = d.resources[0] ?
                        Math.round(d.resources[0].disk/Math.pow(2,30)) + ' ГБ' // 2**30 in ES7
                      : 0;
                    let maxdisk = d.resources[0] ?
                        Math.round(d.resources[0].maxdisk/Math.pow(2,30)) + ' ГБ'
                      : 0;

                    Object.assign(d, {
                        leaf: true,
                        disk,
                        maxdisk,
                        vmStore: vmStore,
                    });
                } else {
                    d.disk = Math.round(d.resources.reduce((a, el) => +a + +el.disk, 0)/Math.pow(2,30)) + ' ГБ';
                    d.maxdisk = Math.round(d.resources.reduce((a, el) => +a + +el.maxdisk, 0)/Math.pow(2,30)) + ' ГБ';
                    d.vmStore = vmStore;
                    d.children = d.resources.map( el => Object.assign(
                        el, d, {
                            leaf: true,
                            storage: el.storage + ' (' + el.node + ')',
                            iconCls: 'x-fa fa-database',
                            disk: Math.round(el.disk/Math.pow(2,30)) + ' ГБ',
                            maxdisk: Math.round(el.maxdisk/Math.pow(2,30)) + ' ГБ',
                            vmStore: Ext.create('Ext.data.ChainedStore', {
                                    source: vmStore,
                                    filters: [
                                        {
                                            property: 'node',
                                            value: el.node,
                                        },
                                    ],
                            }),

                        })
                    );
                    [d.expanded, d.expandable] = [true, false];
                }
                d.node = d.resources.map(n => n.node).join(', ');
                d.nodearray = d.resources.map(n => n.node);
                d.iconCls = 'x-fa fa-database';
                root.children.push(d);
            });
            return root;
        },
        formulaScriptedActionsStore: function(get) {
            let data = get('scriptedActionsData');
            let storeConf =  {
                fields: ['name', 'description'],
                data: data,
            }
            return storeConf;
        },
    }, // End of formulas definitions

    stores: {
    }, // End of stores definitions

});
