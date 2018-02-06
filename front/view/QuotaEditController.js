Ext.define('PveMgr.view.QuotaEditController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pvemgr.quotaedit',
    id: 'quotaeditcontroller',
    itemId: 'quotaeditcontroller',

    afterCompRender: function() {
        let poolCbx = this.getView().getForm().findField('pool');
        let store = poolCbx.getStore();
        PveMgr.comboLoadOnce(poolCbx, store);
    },

    poolChange: function(combo) {

        let recordData = combo.getSelection().getData();
        let form = this.getView().getForm();

        try {
            form.findField('comment').setValue(recordData.comment);
            let quota = /.*___QUOTA: (.*); QUOTA___/.exec( recordData.comment );

            if (quota) quota = JSON.parse( quota[1] );
            else throw new Error('Права доступа и квоты не заданы');

            form.setValues(
                quota
            );
        } catch (err) {
            PveMgr.toast('Не удалось загрузить данные пула: ' + err.message);
            form.getFields().filterBy( f => f.xtype === 'numberfield' )
                .each( f => f.reset() );
        }

        form.findField('cpu').setValue(recordData.allocated.cpu);
        form.findField('mem').setValue(recordData.allocated.mem / 1024 / 1024 / 1024);
        form.findField('disk').setValue(recordData.allocated.diskSize);
    },

    poolQuotaSave: function(button) {
        let data = this.getView().getForm().getValues();
        let poolCbx = this.getView().getForm().findField('pool');
        button.disable(true);

        PveMgr.req( {url: '/api/poolquotasave'}, data, function(resp) {
            console.log(arguments);
            if(resp.success) PveMgr.toast(resp.msg);
            else PveMgr.toast( resp.err.message );
            button.enable(true);
            poolCbx.store.load();
        } );
    },

    poolQuotaReset: function() {
        let poolCbx = this.getView().getForm().findField('pool');
        let store = poolCbx.getStore();
        store.load( function() {
            poolCbx.fireEvent('select', poolCbx);
        });

    },
})
