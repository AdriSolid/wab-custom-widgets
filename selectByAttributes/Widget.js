define([//Dojo
        'dojo/_base/declare', 
        'dojo/_base/lang',
        'dojo/dom-construct',
        'dojo/dom-style', 
        'dojo/Deferred',
        'dojo/dom',
        //Jimu
        'jimu/BaseWidget',
        'jimu/dijit/LoadingShelter',
        'jimu/SelectionManager',
        'jimu/dijit/Message',
        //Dijit
        'dijit/form/Select',
        'dijit/form/Button',
        'dijit/form/TextBox',
        'dijit/form/MultiSelect',
        'dijit/ConfirmDialog',
        //Custom classes
        './idWebMapLayers',
        //Esri
        'esri/tasks/query', 
        'esri/tasks/QueryTask',
        'esri/request',
        'esri/layers/FeatureLayer',
        'esri/symbols/SimpleFillSymbol', 
        'esri/Color', 
        'esri/renderers/SimpleRenderer',
        //Files
        'xstyle/css!./files/bootstrap.min.css',
        './files/jquery-3.3.1.min',
        './files/bootstrap.min',
        //domReady!
        'dojo/domReady!'
        ],
function(declare, lang, domConstruct, domStyle, Deferred, dom,
         BaseWidget, LoadingShelter, SelectionManager, Message,
         Select, Button, TextBox, MultiSelect, ConfirmDialog,
         idWebMapLayers,
         Query, QueryTask, esriRequest, FeatureLayer, SimpleFillSymbol, Color, SimpleRenderer) {

  return declare([BaseWidget], {

    shelter: null,
    layerName: null,
    layer: null,
    field: null,
    url: null,
    uniqueValue: null,
    ese: null,
    selectedField: null,
    selectionManager: SelectionManager.getInstance(),

    startup: function(){
      this.inherited(arguments);
      this._setWidgetSize();
      this._initLoadingShelter();
      this._initLayerChooser();
      this._initButtons();
    },

    _setWidgetSize: function(){
      var panel = this.getPanel();
          panel.position.height = 550;
          panel.setPosition(panel.position);
          panel.panelManager.normalizePanel(panel);
    },

    _initLoadingShelter: function(){
      this.shelter = new LoadingShelter({
        hidden: false
      });
      this.shelter.placeAt(this.loadingNode);
      this.shelter.startup();
      this.shelter.hide();
    },

    _initLayerChooser: function(){
      var idForChangeEvent = "layerChooserNodeEvent" 

      new idWebMapLayers({
        idForChangeEvent: idForChangeEvent,
        layerNode: "layerChooserNode",
        map: this.map,
        geometry: "*", //options: 'point', 'polygon', 'line', 'multiPatch' or '*'
        imageFolderUrl: this.folderUrl
      }) 

      this.layerName = dijit.byId(idForChangeEvent).value
      this._fieldMultiSelect(this.layerName)  
      this.selectFrom.innerHTML = 'SELECT * FROM ' + this.layerName  + ' WHERE:'
   
      dijit.byId(idForChangeEvent).on("change", lang.hitch(this, function(evt){
        this._updateFieldMultiSelect('fieldsMultiSelect', evt) 
        this.selectFrom.innerHTML = 'SELECT * FROM ' + evt + ' WHERE:'
      }))
    },

    _fieldMultiSelect: function(layerId){
      this.layer = this.map.getLayer(layerId) 
      this.url = this.layer.url 
      var fields = this.layer.fields 
      this.field = this.layer.fields

      for(i in fields){
        var opData = domConstruct.create('option')
            opData.innerHTML = fields[i].name
            opData.value = fields[i].name
        dom.byId('fieldsMultiSelect').appendChild(opData)
      }

      var self = this;
      $('#fieldsMultiSelect').on('change', function(){
        self.selectedField = $(this).val();
        $('#textBoxNode').val( $('#textBoxNode').val() + $(this).val() );
        
        var $uniques = $('#uniquesMultiSelect' + ' option');
        $.each($uniques, function(index, element) {
          element.remove();
        });
      });

      $('#uniquesMultiSelect').on('change', function(){
        $('#textBoxNode').val( $('#textBoxNode').val() + "'" + $(this).val() + "'" );
      });
    },

    _updateFieldMultiSelect: function(id, layerId){
      var $uniques = $('#' + id + ' option');
       $.each($uniques, function(index, element) {
        element.remove();
      });

      this.layer = this.map.getLayer(layerId) 
      this.url = this.layer.url 
      var fields = this.layer.fields 
      this.field = this.layer.fields

      for(i in fields){
        var opData = domConstruct.create('option')
            opData.innerHTML = fields[i].name
            opData.value = fields[i].name
        dom.byId(id).appendChild(opData)
      }
    },

    _initButtons: function(){
      for(i in this.config.ids){
        new Button({
          label: this.nls.buttons[this.config.ids[i]],
          value: this.nls.buttons[this.config.ids[i]],
          class: "button",
          onClick: function(){
            $('#textBoxNode').val( $('#textBoxNode').val() + ' ' + this.get("value") + ' ' );
          }
        }, this[this.config.ids[i]]);
      }
    },

    _getUniqueValues: function(){
      this.shelter.show();
      var query = new Query()
          query.where = '1=1';
          query.outFields = this.selectedField;
          new QueryTask(this.url).execute(query, lang.hitch(this, function(results){
            var map = results.features.map(lang.hitch(this, function(record){
              return record.attributes[this.selectedField[0]]
            }))
            var def = new Deferred()
                def.resolve(map);
                def.then(lang.hitch(this, function(results){
                  return results.sort()
                    .filter(lang.hitch(this, function(x, i){
                      return results.indexOf(x) === i; 
                    }))
                })).then(lang.hitch(this, function(results){
                  var $uniques = $('#uniquesMultiSelect option');
                  $.each($uniques, function(index, element){
                    element.remove();
                  });
                  return results
                })).then(lang.hitch(this, function(results){
                  this._updateUniquesMultiselect('uniquesMultiSelect', results)
                })).then(lang.hitch(this, function(results){
                  this.shelter.hide();
                }))
          }))
    },

    _updateUniquesMultiselect: function(id, data){
      for(i in data){
        var opData = domConstruct.create('option')
            opData.innerHTML = data[i]
            opData.value = data[i]
        dom.byId(id).appendChild(opData)
      }
    },

    _performQuery: function(){
      var query = new Query()
          query.where = $('#textBoxNode').val();
          query.outFields = ["*"];
          new QueryTask(this.url).execute(query, lang.hitch(this, function(results){
            this.selectionManager.setSelection(this.layer, results.features);
          }),function(error){
            new Message({
              message: "There was a problem selecting."
            });
          });
    },

    _confirmQuery: function(){
      var query = new Query()
          query.where = $('#textBoxNode').val();
          query.outFields = ["*"];
          new QueryTask(this.url).execute(query, lang.hitch(this, function(results){
            if(results.features.length != 0){
              new Message({
                message: "There expression was successfully verified."
              });
            }else{
              new Message({
                message: "The expression was verified successfully, but no records were returned."
              });
            }
          }),function(error){
            new Message({
              message: "There was an error with the expression."
            });
          });
    },

    _clearSelection: function(){
      this.selectionManager.clearSelection(this.layer)
    }
  });
});
