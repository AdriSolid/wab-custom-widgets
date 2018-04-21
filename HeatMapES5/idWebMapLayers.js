define([
  'dojo/_base/declare',
  'dijit/form/Select',
  'dojo/domReady!'
], function(declare, Select){
  var clazz = declare(null, {
    folderUrl: null,
    geometry: null,
    layers: [],
    selector: null,

    constructor: function(options){
      this.selector = options.selector
      this.geometry = options.geometry || '*'
      this.folderUrl = options.folderUrl

      this.createLayerSelect(options.map)
    },

    createLayerSelect: function(map){
      for(var i = 0; i < map.graphicsLayerIds.length; i++) {
        var layerObject = map.getLayer(map.graphicsLayerIds[i])
        this.layers.push(layerObject)
      }

      this._addOptions(map, this.layers)
    },

    addLayers: function(map, layers){
      this.layers.push(layers)
      this._addOptions(map, layers)
    },

    _addOptions: function(map, layers) {
      if (layers.length === 0) {
        return;
      }

      var recording = layers.map(function(record){
        switch(true){
          case record.geometryType === 'esriGeometryPolygon' && (this.geometry === '*' || this.geometry === 'polygon'):
            return dojo.create('option', {
              label: '<img src="' + this.folderUrl + 'images/polygon_layer.png" height="12.5" width="12.5"> ' + record.name,
              value: record.id
            });
          case record.geometryType === 'esriGeometryPoint' && (this.geometry === '*' || this.geometry === 'point'):
            return dojo.create('option', {
              label: '<img src="' + this.folderUrl + 'images/point_layer.png" height="12.5" width="12.5"> ' + record.name,
              value: record.id
            });
          case record.geometryType === 'esriGeometryLine' && (this.geometry === '*' || this.geometry === 'line'):
            return dojo.create('option', {
              label: '<img src="' + this.folderUrl + 'images/line_layer.png" height="12.5" width="12.5"> ' + record.name,
              value: record.id
            });
          case record.geometryType === 'esriGeometryPolyLine' && (this.geometry === '*' || this.geometry === 'line'):
            return dojo.create('option', {
              label: '<img src="' + this.folderUrl + 'images/line_layer.png" height="12.5" width="12.5"> ' + record.name,
              value: record.id
            });
          case record.geometryType === 'esriGeometryMultiPatch' && (this.geometry === '*' || this.geometry === 'multiPatch'):
            return dojo.create('option', {
              label: '<span><strong> M</strong></span> ' + record.name,
              value: record.id
            });
          default:
            return null;
            /*
          default:
              return dojo.create("option", {
                label: record.name,
                value: record.id
            })*/
        }

      }.bind(this));

      for (var i = 0; i < recording.length; i++) {
        if (typeof recording[i] === "undefined") {
          this.splice(i, 1);
          i--;
        }
      }

      this.selector.addOption(recording);
    },

    getLayers: function() {
      return this.layers;
    },

    selected: function() {
      if (this.layers.length > 0) {
        return this.layers[0].value;
      }
      return null;
    },

  });
  return clazz;
});