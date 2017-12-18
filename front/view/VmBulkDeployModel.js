Ext.define('PveMgr.view.VmBulkDeployModel', {
    extend: 'Ext.app.ViewModel',

    alias: 'viewmodel.pvemgr.vmbulkdeploy',

    data: {
        nextid: 9000,
    },

    stores: {
        vmBulkDeploy: {
            storeId: 'vmBulkDeploy',
            model: 'PveMgr.model.DeployVmModel',
            //autoSync: true,
            autoLoad: true,
            proxy: {
                type: 'memory',
            },
            data: [
                {hostname: 'one1', vmid: 3, template: '100'},
                {hostname: 'two.medindex.corp', vmid: 4, template: '103'},
                {hostname: 'one', vmid: 5},
                {hostname: 'two', vlan: 1431, vmid: 1},
                {hostname: 'one', vlan: 10, vmid: 89},
                {hostname: 'two', vlan: 1431, vmid: 0, mask: 24},
            ],
        },
    },
});
