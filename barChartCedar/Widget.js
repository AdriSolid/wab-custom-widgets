define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        'dojo/on',
        'dojo/_base/lang',
        'dijit/form/Select',
        'dijit/form/Button',
        'dijit/form/CheckBox',
        './webMapLayersIds',
        'dijit/_WidgetsInTemplateMixin',
        'dojo/dom',
        'dojo/_base/connect',
        'dojo/domReady!'],
function(declare, BaseWidget, on, lang, Select, Button, CheckBox, idWebMapLayers, _WidgetsInTemplateMixin, dom){

return declare([BaseWidget], {

      fieldX: null,
      fieldY: null,
      url: null,
      typeChart: null,
      chart: null,
      startUpExtent: null,
      evt: null,
      initialWidgetWidth: null,
      widthMethod: null,

      startup: function() {
        this.inherited(arguments)
        this.getContainerWidth()
        this.initLayerChooser()
        this.initButton()
        this.initCheckButton()
      },

      getContainerWidth: function(){
        if(this.getPanel().containerNode.clientWidth){
          this.initialWidgetWidth = this.getPanel().containerNode.clientWidth
          this.widthMethod = 'this.getPanel().containerNode.clientWidth'
        } else{
          this.initialWidgetWidth = this.getPanel().domNode.clientWidth
          this.widthMethod = 'this.getPanel().domNode.clientWidth'
        }
      },

      initLayerChooser: function(){
        var idForChangeEvent = "layerChooserNodeEvent"

        var layer = new idWebMapLayers({
          idForChangeEvent: idForChangeEvent,
          layerNode: "layerChooserNode",
          map: this.map,
          geometry: "*"
        });

        this.initSelects(dijit.byId(idForChangeEvent).value)
     
        dijit.byId(idForChangeEvent).on("change", lang.hitch(this, function(event){
          this.options(event)
        }))
      },

      initSelects: function(layerId){
        new Select({
          name: "selectFieldX",
          id: "selectFieldX"
        }).placeAt('selectXContainer').startup()

        new Select({
            name: "selectFieldY",
            id: "selectFieldY"
        }).placeAt('selectYContainer').startup()

        new Select({
            name: "selectTypeChart",
            id: "_typeChart",
            options: [{label: "Bar", value: "bar"}, 
                      {label: "Bar-horizontal", value: "bar-horizontal"}]
          }).placeAt('typeChartContainer').startup()

        var fieldXid = dijit.byId('selectFieldX');
        this.fieldX = fieldXid.value;
        fieldXid.on("change", lang.hitch(this, function(event){
            this.fieldX = event
        }))

        var fieldYid = dijit.byId('selectFieldY');
        this.fieldY = fieldYid.value;
        fieldYid.on("change", lang.hitch(this, function(event){
            this.fieldY = event
        }))

        var typeChartId = dijit.byId('_typeChart');
        this.typeChart = typeChartId.value;
        typeChartId.on("change", lang.hitch(this, function(event){
            this.typeChart = event
        }))

        this.options(layerId);
      },

      options: function(layerId){
        var layer = this.map.getLayer(layerId)
        this.url = layer.url
        this.startUpExtent = layer.initialExtent
        var fields = layer.fields

        var map = fields.map(function(record){
          return dojo.create("option", {
            label: record.name,
            value: record.name
          })
        })

        var selectX = dijit.byId('selectFieldX')
        var selectY = dijit.byId('selectFieldY')

        if(selectX.getOptions()){
          selectX.removeOption(selectX.getOptions())
          selectY.removeOption(selectY.getOptions())
          selectX.addOption(map)
          selectY.addOption(map)
        }
      },

      initButton: function(){
        new Button({
          label: "Execute",
          onClick: lang.hitch(this, function(){
              this.displayChart()
          })
        }, "executeChart").startup()
      },

      initCheckButton: function(){
        new CheckBox({
          name: "checkBox",
          checked: false,
          onChange: lang.hitch(this, function(chb){ 
            if(chb === true){
              this.evt = this.map.on('extent-change', lang.hitch(this, function(){
                this.onExtentChanged()
              }))
            } else{
                this.evt.remove()
                this.onExtentChangedOff()
            }
          })
        }, "checkButtonContainer").startup()
      },

      displayChart: function(){
        this.chart = new Cedar({
        "type": this.typeChart,
         "dataset":{
           "url": this.url,
           "mappings":{
             "x": { "field": this.fieldX, "label": this.fieldX },
             "y": { "field": this.fieldY, "label": this.fieldY }
           },
         }
        });

        this.chart.tooltip = {
         "title": "{" + this.fieldX + "}",
         "content": "{" + this.fieldY + "}"
        }

        this.chart.show({
         elementId: "#chart",
         autolabels: true,
         width: this.initialWidgetWidth * 0.9, 
         height: 275
        });
      },

      resize: function(){
        this.chart.width = eval(this.widthMethod) * 0.9
        this.chart.update()
      },

      onExtentChanged: function(){
        var extent = this.map.geographicExtent.toJson()
        this.chart.dataset.query.bbox = extent.xmin + ',' + extent.xmax + ',' + extent.ymin + ',' + extent.ymax
        this.chart.update()
      },

      onExtentChangedOff: function(){
        this.chart.dataset.query.bbox = null
        this.chart.update()
      }
    })
  })
