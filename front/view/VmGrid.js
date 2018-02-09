Ext.define('PveMgr.view.VmGrid', {
    extend: 'Ext.grid.Panel',
    xtype: 'pvemgr.vmgrid',
    title: 'Виртуальные Машины',

    //~ bufferedRenderer: false,
    //~ leadingBufferZone: 200,
    //~ trailingBufferZone: 200,

    features: [{ftype: 'groupingsummary'},{ftype: 'summary'} ],

    header: {
        items: [
            {
                xtype: 'button',
                text: 'Тест',
                handler: 'test',
                tooltip: 'Не нажимать!', 
                margin: '0 0 0 5',
            },{
                xtype: 'button',
                text: 'Клон',
                handler: 'onCloneVm',
                tooltip: 'Копировать данные выбранной ВМ в форму клонирования', 
                margin: '0 0 0 5',
            },{
                xtype: 'button',
                text: 'Адрес',
                tooltip: 'Запрос адреса из операционной системы ВМ',
                handler: 'getVmAddress',
                margin: '0 0 0 5',
            },{
                width: 180,
                xtype: 'combobox',
                fieldLabel: 'Группировать:',
                labelWidth: 90,
                labelStyle: 'font-size: x-small; color: white',
                //labelAlign: 'top',
                value: 'node',
                valueField: 'value',
                reference: 'vmGridGroupCombo',
                store: {
                    fields: ['text', 'value'],
                    data: [
                        {text: 'Пул', value: 'pool'},
                        {text: 'Узел', value: 'node'},
                        {text: 'Статус', value: 'status'},
                        {text: 'Нет', value: false},
                    ],
                },
                listeners: {
                    select: 'onVmGroupingSelect',
                },
                bind: '{vmGridGroupBy}',
                margin: '0 0 0 15',
            },{
                type: 'refresh',
                callback: 'updateVMs',
                margin: '0 0 0 10',
            },
        ]
    },
    plugins:[
        'gridfilters',
        {
            ptype: 'rowwidget',
            widget: {
                xtype: 'pvemgr.vmpanel',
                height: 400,
                maxWidth: 900,
                iconCls: 'x-fa fa-desktop',
                bind: { // Without this bind, binds in VmPanel definition doesn't work
                    title: '{record.vmid} ({record.name})',
                },
            },
        },
    ],
    columns: {
        items: [
            {
                text: 'VMID',
                dataIndex: 'vmid',
                filter: 'number',
                summaryType: 'count',
                width: 70,
            },{
                xtype:'actioncolumn',
                text: 'Действие',
                width: 25*3,
                tdCls: 'pvemgr-vm-actioncolumn',
                hidden: true,
                items: [
                    {
                        //iconCls: 'x-fa fa-play',
                        iconCls:  'pictos pictos-play',
                        tooltip: 'Start',
                        handler: 'vmGridStart',
                    },{
                        //iconCls: 'x-fa fa-stop',
                        iconCls:  'pictos pictos-stop',
                        tooltip: 'Stop',
                        handler: 'vmGridStop',
                    },{
                        //iconCls: 'x-fa fa-remove',
                        iconCls:  'pictos pictos-delete',
                        tooltip: 'Delete',
                        handler: 'vmGridDelete',
                    },
                ],
            },{
                text: 'Статус',
                dataIndex: 'status',
                summaryType: function(records,fields){
                    return fields.filter(f => f == 'running').length;
                },
            },
            {text: 'Тип', dataIndex: 'type', hidden: true},
            {text: 'Шаблон', dataIndex: 'template', hidden: true},
            {text: 'Аптайм', dataIndex: 'uptime', width: 150},
            {text: 'Название', dataIndex: 'name', width: 150},
            {text: 'Адрес', dataIndex: 'ip', width: 150},
            {text: 'Хранилище', dataIndex: 'storage', width: 100},
            {
                text: 'Диски',
                dataIndex: 'disks',
                width: 200,
                xtype:'templatecolumn',
                tpl:'<tpl for="diskarray">{storage} {params.size}, </tpl>',
                //tpl:'<tpl >{name}  </tpl>',
                listeners: {
                    click: {
                        //element: 'body', //bind to the underlying el property on the panel
                        fn: function(){ console.log(this, arguments); }
                    },
                },

            },
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
            {
                text: 'Агент', xtype:'templatecolumn',
                tpl:'<tpl if="config.agent &gt; 0">Включен</tpl>'
            },
            {
                text: 'Узел',
                dataIndex: 'node',
                filter: 'list',
            },
            {text: 'Пул', dataIndex: 'pool'},
            {text: 'ЦПУ', dataIndex: 'maxcpu'},
            {text: 'Память, ГБ', dataIndex: 'maxmem'},
        ],
    },
    store: Ext.create('Ext.data.ChainedStore', {
        source: 'vmStore',
        storeId: 'vmGridStore',
        sorters: [{
            direction: "ASC",
            property: "vmid",
        }],
        autoSort: true,
    }),
    //~ beforeShow: function() {
        //~ this.callParent(arguments);
        //~ this.getStore().load();
    //~ },
    //~ initComponent: function() {
        //~ this.callParent(arguments);
    //~ },
});
