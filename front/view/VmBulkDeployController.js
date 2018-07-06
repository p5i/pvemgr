// Copyright (c) 2018 Medindex (medindex.ru)

Ext.define('PveMgr.view.VmBulkDeployController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pvemgr.vmbulkdeploy',
    //id: 'scriptedactioncontroller',
    //itemId: 'vmcreatorcontroller',
    listen: {
        store: {
            '#vmBulkDeploy': {
                update: 'onUpdate',
                add: function(store, records) {
                    records.forEach(this.updateRecord, this);
                },
            },
            '#vmTemplates': {
                'refresh': function() { // Redraw grid. E.g. template column render.
                    this.lookupReference('bulkVmGrid').getView().refresh();
                },
            },
            '#vmStore': {
                load: function() { // To update information in records. E.g. Node name.
                    let s = this.getStore('vmBulkDeploy');
                    s.each(this.updateRecord, this);
                },
            },
        },
    }, // End of listen definition

    afterCompShow: function() {
        let poolCbx = this.lookupReference('pool');
        let store = poolCbx.getStore();
        PveMgr.comboLoadOnce(poolCbx, store);
    },

    bulkDeployStart: function(button) {

        button.disable(true);

        let panel = this.getView();
        let vms = PveMgr.rawData(
            panel.lookupReference('bulkVmGrid').getStore());
        vms.forEach(vm => {
            if (!vm.name) vm.name = vm.hostname.split('.')[0];
        });
        let users = panel.lookupReference('bulkVmUsersForm').getValues();
        let opts = panel.lookupReference('bulkVmOptionsForm').getValues();
        let poolid = this.lookupReference('pool').getValue();
        PveMgr.deployVms(
            { poolid: poolid,vms: vms, users: users, misc:opts },
            ( req) => button.enable(true) );
    },
    onUpdate: function(store, record, op, modified) { // Event handler
        if(op === 'commit') return;
        if (modified.indexOf('template') !== -1) {
            this.updateNode(record);
        }
    },
    updateRecord: function(record) {
        this.updateNode(record);
    },
    updateNode: function(record) {
        let vmStore = Ext.getStore('vmStore');
        let vmTmpl = vmStore.getById(record.getData().template);
        if (vmTmpl) {
            record.set( 'node', vmTmpl.data.node, { commit: false } );
        }
    },
    addRecord: function() {
        let nextId = this.getViewModel().get('nextid');
        let store = this.lookupReference('bulkVmGrid').store;
        store.insert(store.getCount(), {
            vmid: nextId,
            hostname:'testvm.medindex.corp',
            mask: '24',
            template: '103',
        });
        vmid: this.getViewModel().set('nextid', nextId+1);
        this.lookupReference('bulkVmGrid').getView().refresh();
    },
});
