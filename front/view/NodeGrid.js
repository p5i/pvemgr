Ext.define('PveMgr.view.NodeGrid', {
    extend: 'Ext.grid.Panel',
    xtype: 'pvemgr.nodegrid',
    reference: 'nodeGrid',
    plugins:[
        'gridfilters',
        {
            ptype: 'rowexpander',
            rowBodyTpl: new Ext.XTemplate(
                '<p><tpl for="statusarray">',
                    '<b>{name}:</b> {value}; ',
                '</tpl></p>'
            ),
        },
    ],
    columns: {
        items: [
            {text: 'Имя', dataIndex: 'node'},
            {text: 'Адрес', dataIndex: 'ip'},
            {text: 'ЦПУ', dataIndex: 'maxcpu'},
            {text: 'Память, ГБ', dataIndex: 'maxmem'},
            {
                text: 'Память, %',
                dataIndex: 'mem',
                xtype: 'widgetcolumn',
                widget: {
                    xtype: 'progressbarwidget',
                    textTpl: [
                       '{percent:number("0")}%'
                    ],
                },
            },
            {text: 'Аптайм', dataIndex: 'uptime'},
            {text: 'Идентификатор', dataIndex: 'nodeid', hidden: true},
        ],
    },
    store: 'nodeStore',
    beforeShow: function() {
        this.callParent(arguments);
        this.getStore().load();
    },
});
