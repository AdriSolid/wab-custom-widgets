define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        "dojo/on",
        "dojo/_base/lang",
        "dijit/form/Select",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "./idWebMapLayers",
        'dijit/_WidgetsInTemplateMixin',
        "dojo/dom",
        "dojo/_base/connect",
        "dojo/domReady!"
],
(declare, BaseWidget, on, lang, Select, Button, CheckBox, idWebMapLayers, _WidgetsInTemplateMixin, dom) => {

return declare([BaseWidget], {

      baseClass: 'jimu-widget-chart-widget',
      fieldX: null,
      fieldY: null,
      url: null,
      typeChart: null,
      chart: null,
      startUpExtent: null,
      event: null,
      initialWidgetWidth: null,
      methodWidth: null,

      startup: function() {
        this.inherited(arguments);
        this.getContainerWidth();
        this.initLayerChooser();
        this.initButton();
        this.initCheckButton();
      },

      getContainerWidth: function(){
        if(this.getPanel().containerNode.clientWidth){
          this.initialWidgetWidth = this.getPanel().containerNode.clientWidth
          this.methodWidth = 'this.getPanel().containerNode.clientWidth'
        } else{
          this.initialWidgetWidth = this.getPanel().domNode.clientWidth
          this.methodWidth = 'this.getPanel().domNode.clientWidth'
        }
      },

      initLayerChooser: function(){
        const self = this;
        const idForChangeEvent = "layerChooserNodeEvent";

        var layer = new idWebMapLayers({
          idForChangeEvent: idForChangeEvent,
          layerNode: "layerChooserNode",
          map: this.map
        });

        this.initSelects(dijit.byId(idForChangeEvent).value);
     
        dijit.byId(idForChangeEvent).on("change", function(){
          self.options(this.get("value"));
        })
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

        const self = this

        var fieldXid = dijit.byId('selectFieldX');
        this.fieldX = fieldXid.value;
        fieldXid.on("change", function(){
            self.fieldX = this.get("value")
        }) 

        var fieldYid = dijit.byId('selectFieldY');
        this.fieldY = fieldYid.value;
        fieldYid.on("change", function(){
            self.fieldY = this.get("value")
        })

        var typeChartId = dijit.byId('_typeChart');
        this.typeChart = typeChartId.value;
        typeChartId.on("change", function(){
            self.typeChart = this.get("value")
        })

        this.options(layerId);
      },

      options: function(layerId){
        var layer = this.map.getLayer(layerId)
        this.url = layer.url
        this.startUpExtent = layer.initialExtent
        var fields = layer.fields

        var map = fields.map((record) => {
          return dojo.create("option", {
            label: record.name,
            value: record.name
          })
        })

        const selectX = dijit.byId('selectFieldX')
        const selectY = dijit.byId('selectFieldY')

        if(selectX.getOptions()){
          selectX.removeOption(selectX.getOptions())
          selectY.removeOption(selectY.getOptions())
          selectX.addOption(map)
          selectY.addOption(map)
        }
      },

      initButton: function(){
        const self = this
        let myButton = new Button({
        label: "Execute",
        onClick: () => {
            self.displayChart()
         }
        }, "executeChart").startup()
      },

      initCheckButton: function(){
        const self = this;
        let checkBox = new CheckBox({
        name: "checkBox",
        checked: false,
        onChange: (chb) => { 
          if(chb === true){
            this.event = this.map.on('extent-change', function() {
              self.onExtentChanged()
            });
          } else{
              this.event.remove()
              self.onExtentChangedOff()
          }
        }
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
        this.chart.width =  eval(this.methodWidth) * 0.9
        this.chart.update()
      },

      onExtentChanged: function(){
        let extent = this.map.geographicExtent.toJson()
        this.chart.dataset.query.bbox = extent.xmin + ',' + extent.xmax + ',' + extent.ymin + ',' + extent.ymax
        this.chart.update()
      },

      onExtentChangedOff: function(){
        this.chart.dataset.query.bbox = null
        this.chart.update()
      }

    })
  })