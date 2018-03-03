define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        'dojo/on',
        'dijit/form/Select',
        'dijit/form/Button',
        'dijit/form/CheckBox',
        './idWebMapLayers',
        'esri/layers/FeatureLayer',
        'esri/renderers/HeatmapRenderer',
        'dijit/form/HorizontalSlider',
        'esri/dijit/HeatmapSlider',
        'dijit/ConfirmDialog',
        'dojo/dom-style',
        'dojo/dom-construct',
        'dojo/dom',
        'dojo/domReady!'],
function(declare, BaseWidget, on, Select, Button, CheckBox, idWebMapLayers,
         FeatureLayer, HeatmapRenderer, HorizontalSlider, HeatmapSlider,
         ConfirmDialog, domStyle, domConstruct, dom) {
  
  return declare([BaseWidget], {

    layerName: null,
    field: null,
    url: null,
    blurRadius: null,
    maxValue: null,
    minValue: null,
    heatmapFeatureLayer: null,
    heatmapRenderer: null,
    heatmapLayers: [],
    slider: null,
    myStops: null,

    postCreate: function(){
      this.inherited(arguments) 
      window.self = this
    },

    startup: function() {
      this.inherited(arguments) 
      this.initLayerChooser() 
      this.initButton() 
      this.initSliders() 
      this.hideShowHeatMapSlider() 
      this.initHeatMapSlider() 
      this.slider = dom.byId('showingSlider') 
      domStyle.set(this.slider, 'display', 'none') 
    },

    initLayerChooser: function(){
        var idForChangeEvent = "layerChooserNodeEvent" 

        var layer = new idWebMapLayers({
          idForChangeEvent: idForChangeEvent,
          layerNode: "layerChooserNode",
          map: this.map,
          geometry: "point" //options: 'point', 'polygon', 'line', 'multiPatch' or '*'
        }) 

        this.layerName = dijit.byId(idForChangeEvent).value
        this.initSelect(this.layerName) 
     
        dijit.byId(idForChangeEvent).on("change", function(){
          self.options(this.get("value")) 
        })
      },

    initSelect: function(layerId){
        new Select({
            name: "selectField",
            id: "fieldSelector"
        }).placeAt('selectField').startup() 

        var fieldId = dijit.byId('fieldSelector') 
        this.field = fieldId.value 
        fieldId.on("change", function(){
          self.field = this.get("value") 
        }) 

        this.options(layerId) 
    },

    options: function(layerId){
        var layer = this.map.getLayer(layerId) 
        this.url = layer.url 
        var fields = layer.fields 

        var map = fields.map(function(record){
            return dojo.create("option", {
              label: record.name,
              value: record.name
            }) 
        }) 

        var select = dijit.byId('fieldSelector') 

        if(select.getOptions()){
            select.removeOption(select.getOptions()) 
            select.addOption(map) 
        }
    },

    initButton: function(){
        new Button({
        label: "Execute",
        onClick: function(){
            self.displayHeatMapLayer() 
         }
        }, 'executeHeatMap').startup() 
    },

    initSliders: function(){
        var valueBlurRadius = 10 
        new HorizontalSlider({
            id: "blurRadius",
            value: valueBlurRadius,
            minimum: 0,
            maximum: 30,
            style: "width:300px ",
            onChange: function(value){
                self.blurRadius = value 
                dom.byId("blurRadiusDom").innerHTML = value.toFixed(0) 
            }
        }, 'blurRadiusNode').startup()
        dom.byId("blurRadiusDom").innerHTML = valueBlurRadius 

        var blurRadiusSlider = dijit.byId('blurRadius') 
        this.blurRadius = blurRadiusSlider.value 
        blurRadiusSlider.on("change", function(){
            var value = this.get("value") 
            if(self.heatmapRenderer !== null){
                if (value !== self.heatmapRenderer.blurRadius) {
                self.heatmapRenderer.blurRadius = value 
                self.heatmapFeatureLayer.redraw() 
                }
            }
        }) 

        var valueMaxValue = 100 
        new HorizontalSlider({
            id: "maxValue",
            value: valueMaxValue,
            minimum: 0,
            maximum: 500,
            style: "width:300px ",
            onChange: function(value){
                self.maxValue = value 
                dom.byId("maxValueDom").innerHTML = value.toFixed(0) 
            }
        }, 'maxValueNode').startup() 
        dom.byId("maxValueDom").innerHTML = valueMaxValue 

        var maxValueSlider = dijit.byId('maxValue') 
        this.maxValue = maxValueSlider.value 
        maxValueSlider.on("change", function(){
            var value = this.get("value") 
            if(self.heatmapRenderer !== null){
                if (value !== self.heatmapRenderer.maxPixelIntensity) {
                self.heatmapRenderer.maxPixelIntensity = value 
                self.heatmapFeatureLayer.redraw() 
                }
            }
        }) 

        var valueMinValue = 1 
        new HorizontalSlider({
            id: "minValue",
            value: valueMinValue,
            minimum: 0,
            maximum: 500,
            style: "width:300px ",
            onChange: function(value){
                self.minValue = value 
                dom.byId("minValueDom").innerHTML = value.toFixed(0) 
            }
        }, 'minValueNode').startup() 
        dom.byId("minValueDom").innerHTML = valueMinValue 

        var minValueSlider = dijit.byId('minValue') 
        this.minValue = minValueSlider.value 
        minValueSlider.on("change", function(){
            var value = this.get("value") 
            if(self.heatmapRenderer !== null){
                if (value !== self.heatmapRenderer.minPixelIntensity) {
                self.heatmapRenderer.minPixelIntensity = value 
                self.heatmapFeatureLayer.redraw() 
                }
            }
        }) 
    },
      
    hideShowHeatMapSlider: function(){
        new CheckBox({
        name: "hideShowSlider",
        checked: false,
        onChange: function(evt){ 
            if(evt === true){
            domStyle.set(self.slider, 'display', 'block') 
            } else{
                domStyle.set(self.slider, 'display', 'none') 
            }
         }
        }, "heatmapSliderHideShow").startup() 
    },

    initHeatMapSlider: function(){
        this.myStops = [
            {"ratio":0,"color":{
                "r":133,"g":193,"b":200,"a":0}
            },
            {"ratio":0.01,"color":{
                "r":133,"g":193,"b":200,"a":0}
            },
            {"ratio":0.01,"color":{
                "r":133,"g":193,"b":200,"a":0.7}
            },
            {"ratio":0.01,"color":{
                "r":133,"g":193,"b":200,"a":0.7}
            },
            {"ratio":0.0925,"color":{
                "r":144,"g":161,"b":190,"a":0.7}
            }, 
            {"ratio":0.17500000000000002,"color":{
                "r":156,"g":129,"b":132,"a":0.7}
            },
            {"ratio":0.2575,"color":{
                "r":167,"g":97,"b":170,"a":0.7}
            },
            {"ratio":0.34,"color":{
                "r":175,"g":73,"b":128,"a":0.7}
            },
            {"ratio":0.42250000000000004,"color":{
                "r":184,"g":48,"b":85,"a":0.7}
            },
            {"ratio":0.505,"color":{
                "r":192,"g":24,"b":42,"a":0.7}
            },
            {"ratio":0.5875,"color":{
                "r":200,"g":0,"b":0,"a":0.7}
            },
            {"ratio":0.67,"color":{
                "r":211,"g":51,"b":0,"a":0.7}
            },
            {"ratio":0.7525000000000001,"color":{
                "r":222,"g":102,"b":0,"a":0.7}
            },
            {"ratio":0.8350000000000001,"color":{
                "r":233,"g":153,"b":0,"a":0.7}
            },
            {"ratio":0.9175000000000001,"color":{
                "r":244,"g":204,"b":0,"a":0.7}
            },
            {"ratio":1,"color":{
                "r":255,"g":255,"b":0,"a":0.7}
            }
        ] 

        var heatmapSliderDev = new HeatmapSlider({
          "colorStops": this.myStops
        }, "heatmapSliderDev") 
        heatmapSliderDev.startup() 

        heatmapSliderDev.on("change", function(evt){
          if(self.heatmapRenderer !== null){
            self.heatmapRenderer.setColorStops(evt) 
            self.heatmapFeatureLayer.redraw() 
          }
        }) 
    },

    displayHeatMapLayer: function(){
         var serviceURL = this.url 
         var heatmapFeatureLayerOptions = {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: [this.field]
        } 

        this.heatmapFeatureLayer = new FeatureLayer(serviceURL, heatmapFeatureLayerOptions) 
        this.heatmapRenderer = new HeatmapRenderer({
            field: this.field,
            blurRadius: this.blurRadius,
            maxPixelIntensity: this.maxValue,
            minPixelIntensity: this.minValue,
            colorStops: this.myStops
        }) 

        this.heatmapFeatureLayer.setRenderer(this.heatmapRenderer) 
        this.map.addLayer(this.heatmapFeatureLayer) 
        this.displayClearButton(this.heatmapFeatureLayer)   
    },

    displayClearButton: function(heatMapLayer){
        this.heatmapLayers.push(heatMapLayer)
        new Button({
            label: "Remove all HeatMap layers",
            id: heatMapLayer.id + "_" + this.field + "_button",
            onClick: function(){
                if(self.heatmapLayers.length == 0){
                    //Do nothing
                } else{
                    var dialog = new ConfirmDialog({
                        title: "Warning!",
                        content: "Do you want to remove all the heatMap layers?",
                        style: "width: 300px",
                        onHide: function() {
                            //Do nothing
                         }
                        })
                        dialog.set("buttonOk","Yes")
                        dialog.set("buttonCancel","No")
                        dialog.on('execute', function(){
                          for(i in self.heatmapLayers){
                            self.map.removeLayer(self.heatmapLayers[i])
                          }
                        self.heatmapLayers.length = 0
                        })
                        dialog.on('cancel', function(){/*Do nothing*/})
                        dialog.show()
                }
             }
            }, 'clearLayers').startup()
    }

  }) 
}) 
