Ext.define('PveMgr.view.VmCreatorController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pvemgr.vmcreator',
    id: 'vmcreatorcontroller',
    itemId: 'vmcreatorcontroller',
    //~ init: function() {
        //~ this.getNewId();
    //~ },
    control: {
        'textfield[name!=vms]': {
            change: 'generateVms',
        }
    },
    getNewId: function() {
        var me = this.getView();
        var meForm = me.getForm();

        //result should contain success=true and data property otherwise it will go to failure even if there is no failure
        meForm.load({
            waitMsg: 'Loading...',
            method: 'GET',
            url: 'api/newid',
            params: meForm.getValues(),
            
            success: function(form, action) {
                try {
                    var resp = Ext.decode(action.response.responseText);
                    if (resp.data) {
                        form.setValues(resp.data);
                    }
                } catch (ex) {
                    Ext.Msg.alert('Status', 'Exception: ' + ex.Message);
                }
            },
            
            failure: function(meForm, action) {
                console.log(action);
                PveMgr.toast( 'Ошибка при запросе сврбодного VMID: '
                    + action.response.status + ' ('
                    + action.response.statusText + ')' );
            }
        });
    },
    onCreateClick: function(button) {
        button.disable(true);
        let data = this.getView().getForm().getValues();
        console.log(data);
        let vms = data.vms.split(/[\r\n]+/).map(vm => vm.split(', '));
        vms = vms.map( vm => ({
            vmid: vm[0] || undefined,
            name: vm[1] || undefined,
            hostname: vm[2] || undefined,
            ip: vm[3] || undefined,
            mask: vm[4] || undefined,
            gateway: vm[5] || undefined,
            vlan: data.vlan || undefined,
            template: data.template || undefined,
            node: data.node || undefined,
            start: data.start || undefined,
            dopve: data.dopve || undefined,
        }));
        console.log(vms);
        PveMgr.deployVms({vms: vms},
                (req) => button.enable(true));
    },
    generateVms: function() {
        let templField = this.getView().getForm().findField('template');
        if (!templField.getValue()) {
            templField.select(templField.getStore().getData().getAt(0));
        }
        let vmRecords = Ext.getStore('vmStore').getData();
        // getting data
        let meForm = this.getView().getForm();
        let data = meForm.getValues();

        // modifying data
        let hostname, domainname, vmname, suffix, vmsuffix;
        hostname = data.hostname || 'testvm';
        [hostname, ...domainname] = hostname.split('.');
        domainname = domainname.length ? '.' + domainname.join('.') : ''
        suffix = data.suffix || hostname.match(/\d*$/)[0] || '01';
        if (!data.suffix)
            if (data.num > 1) hostname = hostname.replace(/\d*$/,'');
            else suffix = '';
        if (data.name)  {
            vmname = data.name;
            vmsuffix = data.suffix || vmname.match(/\d*$/)[0] || '01';
            if (!data.suffix) vmname = vmname.replace(/\d*$/,'');
        } else {
            vmname = hostname;
            vmsuffix = suffix;
        }
        let ip = data.ip.split('.');
        if ( (ip.length != 4) || !ip.every(n => {return !isNaN(n) && n >= 0 && n < 255}) )
            ip = null;

        // Outputting data
        data.name || meForm.findField('name').setEmptyText(vmname + vmsuffix);
        let textVms = meForm.findField('vms');
        let vms =[];
        for (let i=0; i < data.num; i++){
            while (vmRecords.find('vmid', data.vmid))
                {data.vmid++}
            let vm = [];
            vm.push(
                data.vmid++,
                vmname + suffix,
                hostname + suffix + domainname,
                ip && ip.join('.') || '', data.mask,
                data. gateway, data.vlan
            );
            vms.push(vm.join(', '));               
            suffix = PveMgr.strIncrement(suffix);
            vmsuffix = PveMgr.strIncrement(vmsuffix);
            ip && ip[3]++ && (ip[3] %= 256);
        }
        textVms.setValue(vms.join('\n'));
    },
    vmTemplateChanged: function(combo) {
        let nodeSelector = this.getView().getForm().findField('node');
        nodeSelector.select( nodeSelector.getStore()
            .findRecord('node', combo.getSelection().data.node) );
    },
});
