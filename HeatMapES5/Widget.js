define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        'dijit/_WidgetsInTemplateMixin',
        'dojo/on',
        'dijit/form/Select',
        'dijit/form/Button',
        'dijit/form/CheckBox',
        './idWebMapLayers',
        'esri/layers/FeatureLayer',
        'esri/renderers/HeatmapRenderer',
        'esri/graphic',
        'esri/geometry/Point',
        'esri/SpatialReference',
        'dijit/form/HorizontalSlider',
        'esri/dijit/HeatmapSlider',
        'dijit/ConfirmDialog',
        'dojo/dom-style',
        'dojo/dom-construct',
        'dojo/dom',
        'dojo/domReady!'],
function(declare, BaseWidget, _WidgetsInTemplateMixin, on, Select, Button, CheckBox, idWebMapLayers,
         FeatureLayer, HeatmapRenderer, Graphic, Point, SpatialReference, HorizontalSlider, HeatmapSlider,
         ConfirmDialog, domStyle, domConstruct, dom) {
  
  return declare([BaseWidget, _WidgetsInTemplateMixin], {

    layerName: null,
    field: null,
    layerId: null,
    blurRadius: null,
    maxValue: null,
    minValue: null,
    heatmapFeatureLayer: null,
    heatmapRenderer: null,
    heatmapLayers: [],
    slider: null,
    myStops: null,

    webMapLayers: null,

    postCreate: function(){
      this.inherited(arguments) 
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

      this.map.on('layer-add', function (evt) {
        this.webMapLayers.addLayers(this.map, [evt.layer])
        if (this.layerId === null) {
          this.initSelect(evt.layer.id)
        }
      }.bind(this));
    },

    initLayerChooser: function(){
        this.webMapLayers = new idWebMapLayers({
          selector: this.layerChooser,
          folderUrl: this.folderUrl,
          map: this.map,
          geometry: 'point' //options: 'point', 'polygon', 'line', 'multiPatch' or '*'
        })

        this.layerChooser.on('change', function(value){
          this.options(value)
        }.bind(this));

        this.layerName = this.webMapLayers.selected()
        this.initSelect(this.layerName)

      },

    initSelect: function(layerId){
      if (layerId) {
        this.field = this.selectField.value
        this.selectField.on('change', function(value){
          this.field = value
        }.bind(this))

        this.options(layerId)
      }
    },

    options: function(layerId){
        this.layerId = layerId
        var layer = this.map.getLayer(layerId)
        var fields = layer.fields

        var map = fields.map(function(record){
            return dojo.create('option', {
              label: record.name,
              value: record.name
            }) 
        }) 

        if(this.selectField.getOptions()){
            this.selectField.removeOption(this.selectField.getOptions())
            this.selectField.addOption(map)
        }
    },

    initButton: function(){
        new Button({
        label: 'Execute',
        onClick: function(){
            this.displayHeatMapLayer()
         }.bind(this)
        }, 'executeHeatMap').startup() 
    },

    initSliders: function(){
        var valueBlurRadius = 10 
        new HorizontalSlider({
            id: 'blurRadius',
            value: valueBlurRadius,
            minimum: 0,
            maximum: 30,
            style: 'width:300px ',
            onChange: function(value){
                this.blurRadius = value
                dom.byId('blurRadiusDom').innerHTML = value.toFixed(0) 
            }.bind(this)
        }, 'blurRadiusNode').startup()
        dom.byId('blurRadiusDom').innerHTML = valueBlurRadius 

        var blurRadiusSlider = dijit.byId('blurRadius') 
        this.blurRadius = blurRadiusSlider.value 
        blurRadiusSlider.on('change', function(){
            var value = this.get('value') 
            if(this.heatmapRenderer !== null){
                if (value !== this.heatmapRenderer.blurRadius) {
                this.heatmapRenderer.blurRadius = value
                this.heatmapFeatureLayer.redraw()
                }
            }
        }.bind(this))

        var valueMaxValue = 100 
        new HorizontalSlider({
            id: 'maxValue',
            value: valueMaxValue,
            minimum: 0,
            maximum: 500,
            style: 'width:300px ',
            onChange: function(value){
                this.maxValue = value
                dom.byId('maxValueDom').innerHTML = value.toFixed(0) 
            }.bind(this)
        }, 'maxValueNode').startup() 
        dom.byId('maxValueDom').innerHTML = valueMaxValue 

        var maxValueSlider = dijit.byId('maxValue') 
        this.maxValue = maxValueSlider.value 
        maxValueSlider.on('change', function(){
            var value = this.get('value') 
            if(this.heatmapRenderer !== null){
                if (value !== this.heatmapRenderer.maxPixelIntensity) {
                this.heatmapRenderer.maxPixelIntensity = value
                this.heatmapFeatureLayer.redraw()
                }
            }
        }.bind(this))

        var valueMinValue = 1 
        new HorizontalSlider({
            id: 'minValue',
            value: valueMinValue,
            minimum: 0,
            maximum: 500,
            style: 'width:300px ',
            onChange: function(value){
                this.minValue = value
                dom.byId('minValueDom').innerHTML = value.toFixed(0) 
            }.bind(this)
        }, 'minValueNode').startup() 
        dom.byId('minValueDom').innerHTML = valueMinValue 

        var minValueSlider = dijit.byId('minValue') 
        this.minValue = minValueSlider.value 
        minValueSlider.on('change', function(){
            var value = this.get('value') 
            if(this.heatmapRenderer !== null){
                if (value !== this.heatmapRenderer.minPixelIntensity) {
                this.heatmapRenderer.minPixelIntensity = value
                this.heatmapFeatureLayer.redraw()
                }
            }
        }.bind(this))
    },
      
    hideShowHeatMapSlider: function(){
        new CheckBox({
        name: 'hideShowSlider',
        checked: false,
        onChange: function(evt){ 
            if(evt === true){
            domStyle.set(this.slider, 'display', 'block')
            } else{
                domStyle.set(this.slider, 'display', 'none')
            }
         }.bind(this)
        }, 'heatmapSliderHideShow').startup() 
    },

    initHeatMapSlider: function(){
        this.myStops = [
            {'ratio':0,'color':{
                'r':133,'g':193,'b':200,'a':0}
            },
            {'ratio':0.01,'color':{
                'r':133,'g':193,'b':200,'a':0}
            },
            {'ratio':0.01,'color':{
                'r':133,'g':193,'b':200,'a':0.7}
            },
            {'ratio':0.01,'color':{
                'r':133,'g':193,'b':200,'a':0.7}
            },
            {'ratio':0.0925,'color':{
                'r':144,'g':161,'b':190,'a':0.7}
            }, 
            {'ratio':0.17500000000000002,'color':{
                'r':156,'g':129,'b':132,'a':0.7}
            },
            {'ratio':0.2575,'color':{
                'r':167,'g':97,'b':170,'a':0.7}
            },
            {'ratio':0.34,'color':{
                'r':175,'g':73,'b':128,'a':0.7}
            },
            {'ratio':0.42250000000000004,'color':{
                'r':184,'g':48,'b':85,'a':0.7}
            },
            {'ratio':0.505,'color':{
                'r':192,'g':24,'b':42,'a':0.7}
            },
            {'ratio':0.5875,'color':{
                'r':200,'g':0,'b':0,'a':0.7}
            },
            {'ratio':0.67,'color':{
                'r':211,'g':51,'b':0,'a':0.7}
            },
            {'ratio':0.7525000000000001,'color':{
                'r':222,'g':102,'b':0,'a':0.7}
            },
            {'ratio':0.8350000000000001,'color':{
                'r':233,'g':153,'b':0,'a':0.7}
            },
            {'ratio':0.9175000000000001,'color':{
                'r':244,'g':204,'b':0,'a':0.7}
            },
            {'ratio':1,'color':{
                'r':255,'g':255,'b':0,'a':0.7}
            }
        ] 

        var heatmapSliderDev = new HeatmapSlider({
          'colorStops': this.myStops
        }, 'heatmapSliderDev') 
        heatmapSliderDev.startup() 

        heatmapSliderDev.on('change', function(evt){
          if(this.heatmapRenderer !== null){
            this.heatmapRenderer.setColorStops(evt)
            this.heatmapFeatureLayer.redraw()
          }
        }.bind(this))
    },

    displayHeatMapLayer: function(){
        var heatmapFeatureLayerOptions = {
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: [this.field ? this.field : '*']
        }

         var layer = this.map.getLayer(this.layerId);
         if (layer.url) {
           this.heatmapFeatureLayer = new FeatureLayer(layer.url, heatmapFeatureLayerOptions)
         } else {
           var graphics = layer.graphics.map(function (graphic) {
               return new Graphic({
                 geometry: graphic.geometry,
                 attributes: graphic.attributes
               })
           });

           var featureCollection = {
             layerDefinition: {
               geometryType: layer.geometryType,
               objectIdField: layer.objectIdField,
               fields: layer.fields
             },
             featureSet: {
               features: graphics,
               geometryType: layer.geometryType,
             }
           };
           this.heatmapFeatureLayer = new FeatureLayer(featureCollection, heatmapFeatureLayerOptions);
         }

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
            label: 'Remove all HeatMap layers',
            id: heatMapLayer.id + '_' + this.field + '_button',
            onClick: function(){
                if(this.heatmapLayers.length == 0){
                    //Do nothing
                } else{
                    var dialog = new ConfirmDialog({
                        title: 'Warning!',
                        content: 'Do you want to remove all the heatMap layers?',
                        style: 'width: 300px',
                        onHide: function() {
                            //Do nothing
                         }
                        })
                        dialog.set('buttonOk','Yes')
                        dialog.set('buttonCancel','No')
                        dialog.on('execute', function(){
                          for(i in this.heatmapLayers){
                            this.map.removeLayer(this.heatmapLayers[i])
                          }
                        this.heatmapLayers.length = 0
                        })
                        dialog.on('cancel', function(){/*Do nothing*/})
                        dialog.show()
                }
             }.bind(this)
            }, 'clearLayers').startup()
    }

  }) 
}) 
