define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        'dojo/on',
        'dojo/_base/lang',
        'dijit/form/Select',
        'dijit/form/Button',
        'dijit/form/CheckBox',
        './idWebMapLayers',
        'esri/graphic',
        'esri/layers/FeatureLayer',
        'esri/renderers/HeatmapRenderer',
        'dijit/form/HorizontalSlider',
        'esri/dijit/HeatmapSlider',
        'esri/toolbars/draw',
        'esri/graphicsUtils',
        'esri/tasks/query', 
        'esri/tasks/QueryTask',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/Color',
        'dijit/ConfirmDialog',
        'dojo/dom-style',
        'dojo/dom-construct',
        'dojo/query',
        'dijit/Tooltip',
        'dojo/dom',
        'dojo/domReady!'],
function(declare, BaseWidget, on, lang, Select, Button, CheckBox, idWebMapLayers, Graphic,
         FeatureLayer, HeatmapRenderer, HorizontalSlider, HeatmapSlider, Draw, graphicsUtils, 
         Query, QueryTask, SimpleFillSymbol, SimpleLineSymbol, Color,
         ConfirmDialog, domStyle, domConstruct, query, Tooltip, dom) {
  
  return declare([BaseWidget], {

    layerName: null,
    field: null,
    url: null,
    layer: null,
    blurRadius: null,
    maxValue: null,
    minValue: null,
    heatmapFeatureLayer: null,
    heatmapRenderer: null,
    heatmapLayers: [],
    slider: null,
    graphicGeometry: null,
    images: ["RECTANGLE-draw.png", "ELLIPSE-draw.png", "CIRCLE-draw.png", "FREEHAND_POLYGON-draw.png", "POLYGON-draw.png"], //'images/drawIcons' folder
    myStops: [
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
            ],

    /*postCreate: function(){
      this.inherited(arguments) 
    },*/

    startup: function() {
      this.inherited(arguments) 
      this.initLayerChooser() 
      this.initButton() 
      this.initSliders() 
      this.hideShowHeatMapSlider() 
      this.initHeatMapSlider() 
      this.initDrawingTools()
      this.slider = dom.byId('showingSlider') 
      domStyle.set(this.slider, 'display', 'none') 
      domStyle.set('hideShowDrawIcons', 'display', 'none')
    },

    initLayerChooser: function(){
        var idForChangeEvent = "layerChooserNodeEvent" 

        new idWebMapLayers({
          idForChangeEvent: idForChangeEvent,
          layerNode: "layerChooserNode",
          map: this.map,
          geometry: "point", //options: 'point', 'polygon', 'line', 'multiPatch' or '*'
          imageFolderUrl: this.folderUrl
        }) 
        console.log(this.folderUrl)

        this.layerName = dijit.byId(idForChangeEvent).value
        this.initSelect(this.layerName) 
     
        dijit.byId(idForChangeEvent).on("change", lang.hitch(this, function(evt){
          this.options(evt) 
        }))
      },

    initSelect: function(layerId){
        new Select({
            name: "selectField",
            id: "fieldSelector"
        }).placeAt('selectField').startup() 

        var fieldId = dijit.byId('fieldSelector') 
        this.field = fieldId.value 
        fieldId.on("change", lang.hitch(this, function(evt){
          this.field = evt
        }))

        this.options(layerId) 
    },

    options: function(layerId){
        this.layer = this.map.getLayer(layerId) 
        this.url = this.layer.url 
        var fields = this.layer.fields 

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
        label: this.nls.execute,
        onClick: lang.hitch(this, function(){
            this.getDataByExtent() 
         })
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
            onChange: lang.hitch(this, function(value){
                this.blurRadius = value 
                dom.byId("blurRadiusDom").innerHTML = value.toFixed(0) 
            })
        }, 'blurRadiusNode').startup()
        dom.byId("blurRadiusDom").innerHTML = valueBlurRadius 

        var blurRadiusSlider = dijit.byId('blurRadius') 
        this.blurRadius = blurRadiusSlider.value 
        blurRadiusSlider.on("change", lang.hitch(this, function(value){
            if(this.heatmapRenderer !== null){
                if(value !== this.heatmapRenderer.blurRadius){
                  this.heatmapRenderer.blurRadius = value 
                  this.heatmapFeatureLayer.redraw() 
                }
            }
        }))

        var valueMaxValue = 100 
        new HorizontalSlider({
            id: "maxValue",
            value: valueMaxValue,
            minimum: 0,
            maximum: 500,
            style: "width:300px ",
            onChange: lang.hitch(this, function(value){
                this.maxValue = value 
                dom.byId("maxValueDom").innerHTML = value.toFixed(0) 
            })
        }, 'maxValueNode').startup() 
        dom.byId("maxValueDom").innerHTML = valueMaxValue 

        var maxValueSlider = dijit.byId('maxValue') 
        this.maxValue = maxValueSlider.value 
        maxValueSlider.on("change", lang.hitch(this, function(value){
            if(this.heatmapRenderer !== null){
                if(this !== this.heatmapRenderer.maxPixelIntensity){
                  this.heatmapRenderer.maxPixelIntensity = value 
                  this.heatmapFeatureLayer.redraw() 
                }
            }
        })) 

        var valueMinValue = 1 
        new HorizontalSlider({
            id: "minValue",
            value: valueMinValue,
            minimum: 0,
            maximum: 500,
            style: "width:300px ",
            onChange: lang.hitch(this, function(value){
                this.minValue = value 
                dom.byId("minValueDom").innerHTML = value.toFixed(0) 
            })
        }, 'minValueNode').startup() 
        dom.byId("minValueDom").innerHTML = valueMinValue 

        var minValueSlider = dijit.byId('minValue') 
        this.minValue = minValueSlider.value 
        minValueSlider.on("change", lang.hitch(this, function(value){
            if(this.heatmapRenderer !== null){
                if(value !== this.heatmapRenderer.minPixelIntensity){
                  this.heatmapRenderer.minPixelIntensity = value 
                  this.heatmapFeatureLayer.redraw() 
                }
            }
        }))
    },
      
    hideShowHeatMapSlider: function(){
        new CheckBox({
        name: "hideShowSlider",
        checked: false,
        onChange: lang.hitch(this, function(evt){ 
            if(evt === true){
              domStyle.set(this.slider, 'display', 'block') 
            } else{
                domStyle.set(this.slider, 'display', 'none') 
            }
         })
        }, "heatmapSliderHideShow").startup() 
    },

    initDrawingTools: function(){
        this.images.map(lang.hitch(this, function(record){
            dom.byId('icons').insertAdjacentHTML('afterbegin',
              ' <img id="' + record.substr(0, record.indexOf('-')) + '" class="drawIcons" height="45" width="45"' +
              '  src="' + this.folderUrl + 'images/drawIcons/' + record + '">'
            )
            new Tooltip({
              connectId: [record.substr(0, record.indexOf('-'))],
              label: record.substr(0, record.indexOf('-')) + '&nbsp;&nbsp;&nbsp;'
            })
        }))

        var toolbar = new Draw(this.map);
            toolbar.on("draw-end", lang.hitch(this, function(evtObj){
                this.map.graphics.clear()
                toolbar.deactivate()
                var geometry = evtObj.geometry
                var symbol = new SimpleFillSymbol(
                    SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 2),
                    new Color([0, 0, 0, 0]))
                var graphic = new Graphic(geometry, symbol)
                this.map.graphics.add(graphic)
                this.graphicGeometry = geometry
            }))

        var images = query(".drawIcons")
            images.map(function(record){
               var id = dom.byId(record.id)
                   id.onclick = function(){
                     this.style.border = '2px solid grey';
                     toolbar.activate(eval('Draw.' + this.id))
                   }
                   id.onmouseover = function(){
                     this.style.border = '1px solid grey';
                   }
                   id.onmouseout = function(){
                     this.style.border = '';
                   }
            })
    
        new CheckBox({
            name: "drawingTools",
            checked: false,
            onChange: lang.hitch(this, function(evt){ 
                if(evt === true){
                  domStyle.set('hideShowDrawIcons', 'display', 'block') 
                }else{
                  domStyle.set('hideShowDrawIcons', 'display', 'none') 
                }
            })
        }, 'drawingToolsNode').startup() 
    },

    clearDrawGraphics: function(){
        this.map.graphics.clear()
        this.graphicGeometry = null
    },

    initHeatMapSlider: function(){
        var heatmapSliderDev = new HeatmapSlider({
          "colorStops": this.myStops
        }, "heatmapSliderNode")
            heatmapSliderDev.startup() 
            heatmapSliderDev.on("change", lang.hitch(this, function(evt){ 
              if(this.heatmapRenderer !== null){
                this.heatmapRenderer.setColorStops(evt) 
                this.heatmapFeatureLayer.redraw() 
              }
            }))
    },

    displayHeatMapLayer: function(data){
        var featureCollection = {
          layerDefinition: {
            geometryType: this.layer.geometryType,
            objectIdField: this.layer.objectIdField,
            fields: this.field
          },
          featureSet: {
            features: data,
            geometryType: this.layer.geometryType,
          }
        }

        var heatmapFeatureLayerOptions = {
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: [this.field]
        } 

        this.heatmapFeatureLayer = new FeatureLayer(featureCollection, heatmapFeatureLayerOptions) 
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

    getDataByExtent: function(){
        if (this.graphicGeometry) {
          var query = new Query()
              query.where = "1=1"
              query.returnGeometry = true
              query.geometry = this.graphicGeometry
              query.outFields = ["*"]
              new QueryTask(this.url).execute(query, lang.hitch(this, function(results){
                var graphics = results.features.map(function(graphic){
                    return new Graphic({
                        geometry: graphic.geometry,
                        attributes: graphic.attributes
                    })
                })
                this.displayHeatMapLayer(graphics)
              }))
        } else {
          var query = new Query()
              query.where = "1=1"
              query.returnGeometry = true
              query.outFields = ["*"]
              new QueryTask(this.url).execute(query, lang.hitch(this, function(results){
                var graphics = results.features.map(function(graphic){
                    return new Graphic({
                        geometry: graphic.geometry,
                        attributes: graphic.attributes
                    })
                })
                this.displayHeatMapLayer(graphics)
              }))
        }
    },

    displayClearButton: function(heatMapLayer){
        this.heatmapLayers.push(heatMapLayer)
        new Button({
            label: this.nls.removeButton,
            id: heatMapLayer.id + "_" + this.field + "_button",
            onClick: lang.hitch(this, function(){ 
                if(this.heatmapLayers.length == 0){
                    //Do nothing
                } else{
                    var dialog = new ConfirmDialog({
                        title: this.nls.alertTitle,
                        content: this.nls.alertContent,
                        style: "width: 300px",
                        onHide: function(){/*Do nothing*/}
                        })
                        dialog.set("buttonOk", this.nls.alertButtonOk)
                        dialog.set("buttonCancel", this.nls.alertButtonCancel)
                        dialog.on('execute', lang.hitch(this, function(){ 
                          for(i in this.heatmapLayers){
                            this.map.removeLayer(this.heatmapLayers[i])
                          }
                          this.heatmapLayers.length = 0
                        }))
                        dialog.on('cancel', function(){/*Do nothing*/})
                        dialog.show()
                }
             })
            }, 'clearLayers').startup()
    }
  }) 
})
