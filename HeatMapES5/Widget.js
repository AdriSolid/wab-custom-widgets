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
    myStops: null,

    webMapLayers: null,
    idPrefix: 'heatmapFeatureLayer',

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

      this.map.on('layer-add-result', function (evt) {
        if (this._isHeatmapLayer(evt.layer)) {
          return;
        }

        this.webMapLayers.addLayers(this.map, [evt.layer])
        if (this.layerId === null) {
          this.initSelect(evt.layer.id)
        }
      }.bind(this));
    },

    _isHeatmapLayer: function(layer) {
      return layer.id && layer.id.indexOf(this.idPrefix) > -1;
    },

    initLayerChooser: function(){
        this.webMapLayers = new idWebMapLayers({
          selector: this.layerChooser,
          folderUrl: this.folderUrl,
          map: this.map,
          geometry: this.config.geometry //'point' //options: 'point', 'polygon', 'line', 'multiPatch' or '*'
        })
        this.layerChooser.on('change', this.options.bind(this));

        this.layerName = this.webMapLayers.selected()
        this.initSelect(this.layerName)
      },

    initSelect: function(layerId){
      if (layerId) {
        this.field = this.selectField.value;
        this.selectField.on('change', function(value){
          this.field = value;
        }.bind(this));

        this.options(layerId);
      }
    },

    options: function(layerId){
        this.layerId = layerId
        var layer = this.map.getLayer(layerId)
        var fields = layer.fields.slice(0);
        fields.unshift({name: '*'});

        var map = fields.map(function(record){
            return dojo.create('option', {
              label: record.name,
              value: record.name
            }) 
        })

        if(this.selectField.getOptions()){
            this.selectField.removeOption(this.selectField.getOptions())
        }
        this.selectField.addOption(map)
    },

    initButton: function(){
      this.executeHeatMap.on('click', this.displayHeatMapLayer.bind(this))
    },

    initSliders: function(){
        var valueBlurRadius = 10 
        this.blurRadiusSlider = new HorizontalSlider({
            value: valueBlurRadius,
            minimum: 0,
            maximum: 30,
            style: 'width:300px ',
        }, this.blurRadiusSlider);
        this.blurRadiusSlider.startup()
        this.blurRadiusSliderValue.innerHTML = valueBlurRadius

        this.blurRadius = this.blurRadiusSlider.get('value')
        this.blurRadiusSlider.on('change', function(value){
            this.blurRadius = value
            this.blurRadiusSliderValue.innerHTML = value.toFixed(0)

            if(this.heatmapRenderer !== null){
                if (value !== this.heatmapRenderer.blurRadius) {
                this.heatmapRenderer.blurRadius = value
                this.heatmapFeatureLayer.redraw()
                }
            }
        }.bind(this))

        var valueMaxValue = 100
        this.maxValueSlider = new HorizontalSlider({
            value: valueMaxValue,
            minimum: 0,
            maximum: 500,
            style: 'width:300px ',
        }, this.maxValueSlider);
        this.maxValueSlider.startup()
        this.maxSliderValue.innerHTML = valueMaxValue

        this.maxValue = this.maxValueSlider.value
        this.maxValueSlider.on('change', function(value){
            this.maxValue = value
            this.maxSliderValue.innerHTML = value.toFixed(0)
            if(this.heatmapRenderer !== null){
                if (value !== this.heatmapRenderer.maxPixelIntensity) {
                this.heatmapRenderer.maxPixelIntensity = value
                this.heatmapFeatureLayer.redraw()
                }
            }
        }.bind(this))

        var valueMinValue = 1
        this.minValueSlider = new HorizontalSlider({
            value: valueMinValue,
            minimum: 0,
            maximum: 500,
            style: 'width:300px ',
        }, this.minValueSlider);
        this.minValueSlider.startup()
        this.minSliderValue.innerHTML = valueMinValue

        this.minValue = this.minValueSlider.value
        this.minValueSlider.on('change', function(value){
            this.minValue = value
            this.minSliderValue.innerHTML = value.toFixed(0)
            if(this.heatmapRenderer !== null){
                if (value !== this.heatmapRenderer.minPixelIntensity) {
                  this.heatmapRenderer.minPixelIntensity = value
                  this.heatmapFeatureLayer.redraw()
                }
            }
        }.bind(this))
    },
      
    hideShowHeatMapSlider: function(){
      this.heatmapSliderHideShow = new CheckBox({
        name: 'hideShowSlider',
        checked: false,
        onChange: function(evt){ 
            if(evt === true){
              domStyle.set(this.showingSlider, 'display', 'block')
            } else{
              domStyle.set(this.showingSlider, 'display', 'none')
            }
         }.bind(this)
        }, this.heatmapSliderHideShow);
    },

    initHeatMapSlider: function(){
        this.myStops = this.config.colorStops;

        this.heatmapSliderDev = new HeatmapSlider({
          'colorStops': this.myStops
        }, this.heatmapSliderDev);
        this.heatmapSliderDev.startup();

        this.heatmapSliderDev.on('change', function(evt){
          if(this.heatmapRenderer !== null){
            this.heatmapRenderer.setColorStops(evt)
            this.heatmapFeatureLayer.redraw()
          }
        }.bind(this))
    },

    displayHeatMapLayer: function(){
        var heatmapFeatureLayerOptions = {
          id: this.idPrefix + this.heatmapLayers.length,
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
        this.clearLayers.on('click', this._showRemoveDialog.bind(this));
        domStyle.set(this.clearLayers.domNode, 'display', '')
    },

    _showRemoveDialog: function() {
      if(this.heatmapLayers.length > 0){
        var dialog = new ConfirmDialog({
          title: this.nls.removeTitle,
          content: this.nls.removeDescription,
          style: 'width: 300px',
          onHide: function() { }
        })
        dialog.set('buttonOk', this.nls.removeConfirm)
        dialog.set('buttonCancel', this.nls.removeCancel)
        dialog.on('execute', this._removeHeatmapLayers.bind(this))
        dialog.on('cancel', function(){ })
        dialog.show()
      }
    },

    _removeHeatmapLayers: function() {
      for(var i in this.heatmapLayers){
        this.map.removeLayer(this.heatmapLayers[i])
      }
      this.heatmapLayers.length = 0
      domStyle.set(this.clearLayers.domNode, 'display', 'none')
    },

  }) 
}) 
