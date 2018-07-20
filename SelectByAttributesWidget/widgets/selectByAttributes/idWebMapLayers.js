define([
    'dojo/_base/declare',
    'dijit/form/Select',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dojo/dom',
    'dojo/on',
    'dojo/domReady!'
  ], function(declare, Select, domConstruct, domAttr, dom, on){
    var clazz = declare(null, {
     
      constructor: function(options){
        this.createLayerSelect(options.idForChangeEvent, options.layerNode, options.map, options.geometry, options.imageFolderUrl)
      },
  
      createLayerSelect: function(id, layerNode, map, geometry, imageFolder){
  
        new Select({
          name: layerNode,
          id: id
        }).placeAt(layerNode).startup()
  
        var layers = [];
  
        for(var i = 0; i < map.graphicsLayerIds.length; i++) {
          var layerObject = map.getLayer(map.graphicsLayerIds[i]);
          if(layerObject.url){
            layers.push(layerObject)
          } 
        }
  
        var recording = layers.map(function(record){
          switch(true){
            case record.geometryType === "esriGeometryPolygon" && (geometry === '*' || geometry === 'polygon'):
              return dojo.create("option", {
                label: '<img src="' + imageFolder + 'images/polygon_layer.png" height="12.5" width="12.5"> ' + record.name,
                value: record.id
              })
            case record.geometryType === "esriGeometryPoint" && (geometry === '*' || geometry === 'point'):
              return dojo.create("option", {
                label: '<img src="' + imageFolder + 'images/point_layer.png" height="12.5" width="12.5"> ' + record.name,
                value: record.id
              })
            case record.geometryType === "esriGeometryLine" && (geometry === '*' || geometry === 'line'):
              return dojo.create("option", {
                label: '<img src="' + imageFolder + 'images/line_layer.png" height="12.5" width="12.5"> ' + record.name,
                value: record.id
              })
            case record.geometryType === "esriGeometryPolyLine" && (geometry === '*' || geometry === 'line'):
              return dojo.create("option", {
                label: '<img src="' + imageFolder + 'images/line_layer.png" height="12.5" width="12.5"> ' + record.name,
                value: record.id
              })
            case record.geometryType === "esriGeometryMultiPatch" && (geometry === '*' || geometry === 'multiPatch'):
              return dojo.create("option", {
                label: '<span><strong> M</strong></span> ' + record.name,
                value: record.id
              })
            default:
              return null
          }
        })
  
        var selectLayer = dijit.byId(id)
            selectLayer.addOption(recording)
      },
  
  });
  return clazz;
});