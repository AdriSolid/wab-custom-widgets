define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        "dojo/on",
        "dojo/_base/lang",
        "jimu/dijit/LayerChooserFromMap",
        "jimu/dijit/LayerChooserFromMapWithDropbox",
        "dijit/form/Select",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dojo/dom-construct",
        "dijit/registry",
        'dijit/_WidgetsInTemplateMixin',
        "dojo/dom",
        'dojo/query',  
        'dojo/dom-style',
        "dojo/_base/connect",
        "dojo/domReady!"
],
function(declare, BaseWidget, on, lang, LayerChooserFromMap, LayerChooserFromMapWithDropbox, 
         Select, Button, CheckBox, domConstruct, registry,
         _WidgetsInTemplateMixin, dom, dojoQuery, domStyle) {

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
        this.inherited(arguments)
        this.initLayerChooser()
        this.initSelects()
        this.initButton()
        this.initCheckButton()
        if(this.getPanel().containerNode.clientWidth){
          this.initialWidgetWidth = this.getPanel().containerNode.clientWidth
          this.methodWidth = 'this.getPanel().containerNode.clientWidth'
        } else{
          this.initialWidgetWidth = this.getPanel().domNode.clientWidth
          this.methodWidth = 'this.getPanel().domNode.clientWidth'
        }
      },

      initLayerChooser: function(){
        const args = {
          multiple: false,
          createMapResponse: this.map.webMapResponse
        }

        var templayerChooserFromMap = new LayerChooserFromMap(args)

        var layerChooserFromMap = new LayerChooserFromMapWithDropbox({
          layerChooser: templayerChooserFromMap
        })

        layerChooserFromMap.placeAt('layerChooserNode')
        layerChooserFromMap.startup()

        this.own(on(layerChooserFromMap, 'selection-change', (layerInfo) => {
          this.options(layerInfo)
        }))
      },

      initSelects: function(){
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
            options: [{label: "", value: "", selected: true},
                      {label: "Bar", value: "bar"}, 
                      {label: "Bar-horizontal", value: "bar-horizontal"}]
        }).placeAt('typeChartContainer').startup()

        const self = this

        dijit.byId('selectFieldX').on("change", function(){
            self.fieldX = this.get("value")
        }) 

        dijit.byId('selectFieldY').on("change", function(){
            self.fieldY = this.get("value")
        })

        dijit.byId('_typeChart').on("change", function(){
            self.typeChart = this.get("value")
        })
      },

      options: function(layer){
        this.url = layer[0].url
        this.startUpExtent = layer[0].initialExtent
        var fields = layer[0].fields

        var map = fields.map((record) => {
          return dojo.create("option", {
            label: record.name,
            value: record.name,
            selected: false
          })
        })

        const selectX = dijit.byId('selectFieldX')
        const selectY = dijit.byId('selectFieldY')

        if(selectX.getOptions()){
          selectX.removeOption(selectX.getOptions())
          selectY.removeOption(selectY.getOptions())
          selectX.addOption({label: "", value: "", selected: true})
          selectY.addOption({label: "", value: "", selected: true})
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
