define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        'dojo/_base/lang',
        './idWebMapLayers',
        'dijit/form/Select',
        'dojo/dom-construct',
        "dijit/form/TextBox",
        "esri/geometry/webMercatorUtils",
        "esri/geometry/Polygon",
        "esri/graphic",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/geometry/Point",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/Color",
        'esri/tasks/query', 
        'esri/tasks/QueryTask',
        "jimu/SelectionManager",
        'dojo/dom-style',
        "dijit/form/RadioButton",
        "dijit/form/Button", 
        'dijit/form/CheckBox',
        'dojo/dom',
        'dojo/domReady!'],
function(declare, BaseWidget, lang, idWebMapLayers, Select, domConstruct, TextBox, webMercatorUtils, Polygon, 
         Graphic, SimpleMarkerSymbol, Point, SimpleLineSymbol, SimpleFillSymbol, Color, Query, QueryTask, SelectionManager, 
         domStyle, RadioButton, 
         Button, CheckBox, dom) {

  return declare([BaseWidget], {

    unit: null,
    layer: null,
    url: null,
    polygon: null,
    selectionManager: SelectionManager.getInstance(),
    clickEvent: null,

    startup: function() {
      this.inherited(arguments);
      this.initLayerChooser() 
      this.initCoords()
      this.initSelect()
      this.initDistance()
      this.createRadios()
      this.selectFeatures()
      domStyle.set('hideShowSelectionTools', 'display', 'none')
    },
          
    onOpen: function(){
        this.clickEvent = this.map.on("click", lang.hitch(this, function(evt){
          this.executeBuffer(evt, 'mapClick')
        }))
    },

    initLayerChooser: function(){
        var idForChangeEvent = "layerChooserNodeEvent" 

        new idWebMapLayers({
          idForChangeEvent: idForChangeEvent,
          layerNode: "layerChooserNode",
          map: this.map,
          geometry: "*", //options: 'point', 'polygon', 'line', 'multiPatch' or '*'
          imageFolderUrl: this.folderUrl
        }) 

        this.layer = this.map.getLayer(dijit.byId(idForChangeEvent).value)
        this.url = this.layer.url

        dijit.byId(idForChangeEvent).on("change", lang.hitch(this, function(evt){
          this.layer = this.map.getLayer(evt)
          this.url = this.layer.url
        }))
    },
          
    initCoords: function(){
      new TextBox({
        id: 'xNode',
        placeHolder: this.nls.xPlaceholder,
        style: 'width:10em;'
      }, 'coordsXNode')

      new TextBox({
        id: 'yNode',
        placeHolder: this.nls.yPlaceholder,
        style: 'width:10em;'
      }, 'coordsYNode')
    },

    initSelect: function(){
      new Select({
        id: "unitsSelector"
      }).placeAt('unitsNode').startup() 

      var units = ["miles", "feet", "meters", "kilometers"]

      var map = units.map(function(record){
        return domConstruct.create("option", {
          label: record,
          value: record
        }) 
      }) 

      var select = dijit.byId('unitsSelector') 
          select.addOption(map) 
        
      this.unit = select.value 
          select.on("change", lang.hitch(this, function(evt){
            this.unit = evt
          }))
    },

    initDistance: function(){
      new TextBox({
        id: 'distance',
        value: this.nls.distanceValue,
      }, "textBoxNode");

      var textBox = dijit.byId('distance')
      this.distance = textBox.value
          textBox.on("change", lang.hitch(this, function(evt){
                this.distance = evt
              }))
    },

    executeBuffer: function(evt, mode){
      var coords;
      if(mode === 'mapClick'){
        coords = webMercatorUtils.xyToLngLat(evt.mapPoint.x, evt.mapPoint.y)
      }else{
        coords = [dijit.byId('xNode').value, dijit.byId('yNode').value]
      }
  
      var pointSymbol = new SimpleMarkerSymbol(
          "cross",
          20,
          new SimpleLineSymbol(
            "solid",
            new Color([255,0,0,0.65]), 2
          )
        );
      var inPoint = new Point( {"x": coords[0], "y": coords[1], "spatialReference": {"wkid": 4326 } });
      var bufferCenter = new Graphic(inPoint, pointSymbol);
      this.map.graphics.add(bufferCenter)

      var point = turf.point(coords)
      var buffered = turf.buffer(point, this.distance, {units: this.unit})
  
      var map = buffered.geometry.coordinates[0].map(function(record){
        return [record[0], record[1]]
      })
 
      var polygonJson = {"rings": [map], "spatialReference": {"wkid": 4326} }
      this.polygon = new Polygon(polygonJson)
      var symbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([255,0,0,0.65]), 2
            ),
            new Color([255,0,0,0.15])
          );
       var graphic = new Graphic(this.polygon, symbol)
       this.map.graphics.add(graphic)
       dijit.byId('clearBuffersButton').setDisabled(false)

       if(dijit.byId('enabled').checked){
        this.intersects()
       }else{
        this.selectionManager.clearSelection(this.layer)
       }
    },

    createRadios: function(){
      new RadioButton({
        checked: true,
        value: "enabled",
      }, "enabled").startup()

      new RadioButton({
        checked: false,
        value: "disabled",
      }, "disabled").startup()

      new Button({
        onClick: lang.hitch(this, function(){
            this.selectionManager.clearSelection(this.layer)
            dom.byId('featureCountNode').innerHTML = 'Selected Features: 0'
        })
      }, 'clearSelection').startup() 

      new Button({
        onClick: lang.hitch(this, function(){
            this.executeBuffer('coordsInput')
        })
      }, 'executeBufferCoords').startup() 

      new Button({
        id: 'clearBuffersButton',
        disabled: true,
        onClick: lang.hitch(this, function(){
            this.clearBuffers()
        })
      }, 'clearBuffers').startup() 
    },

    selectFeatures: function(){
      new CheckBox({
          checked: false,
          onChange: lang.hitch(this, function(evt){ 
              if(evt === true){
                domStyle.set('hideShowSelectionTools', 'display', 'block') 
              }else{
                domStyle.set('hideShowSelectionTools', 'display', 'none') 
              }
          })
      }, 'selectionNode').startup() 
    },

    intersects: function(){
      var query = new Query()
          query.where = "1=1"
          query.returnGeometry = true
          query.geometry = this.polygon
          query.outFields = ["*"]
          new QueryTask(this.url).execute(query, lang.hitch(this, function(results){
            this.selectionManager.setSelection(this.layer, results.features)
            dom.byId('featureCountNode').innerHTML = 'Selected Features: ' + results.features.length
          }))
    },

    clearBuffers: function(){
      this.map.graphics.clear()
      dijit.byId('clearBuffersButton').setDisabled(true)
    },
          
    onClose: function(){
      this.clickEvent.remove()
    }
  })
})
