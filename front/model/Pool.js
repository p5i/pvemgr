Ext.define('PveMgr.model.Pool', {
    extend: 'Ext.data.Model',
    idProperty: 'poolid',
    fields: [
        'poolid',
        'comment',
        {
            name: 'storage',
            calculate: record => record.members
                .filter(m => m.type === 'storage')
                .map(s => s.storage).join(' ,'),
        },
        //~ {
            //~ name: 'vms',
            //~ calculate: record => record.vms
                //~ .map(vm => vm.vmid).join(' ,'),
        {
            name: 'vms',
            calculate: record => console.log(record),
        },
        {
            name: 'resources',
            calculate: record => record.vms.toString() + ' ' + record.storage.toString, // Temporary stub
        },
        {
            name: 'acl',
            calculate: record => record.comment, // Temporary stub
        },
    ],
});
