define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        'dojo/on',
        'dojo/_base/lang',
        'dijit/form/Select',
        'dijit/form/Button',
        'dijit/form/CheckBox',
        './webMapLayersIds',
        'esri/tasks/query', 
        'esri/tasks/QueryTask',
        'dojo/dom',
        'dojo/domReady!'],
function(declare, BaseWidget, on, lang, Select, Button, CheckBox, webMapLayersIds, Query, QueryTask, dom) {
  
  return declare([BaseWidget], {

    fieldX: null,
    fieldY: null,
    url: null,
    type: null,
    chart: null,

    startup: function() {
        this.inherited(arguments)
        this.initLayerChooser()
        this.initButton()
    },

    initLayerChooser: function(){
        var idForChangeEvent = "layerChooserNodeEvent";

        new webMapLayersIds({
          idForChangeEvent: idForChangeEvent,
          layerNode: "layerChooserNode",
          map: this.map,
          geometry: "*"
        });

        this.initSelects(dijit.byId(idForChangeEvent).value);

        dijit.byId(idForChangeEvent).on("change", lang.hitch(this, function(evt){
          this.options(evt)
        }))
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
            options: [{label: "Line", value: "line"}, 
                      {label: "Bar", value: "bar"}]
          }).placeAt('typeChartContainer').startup()

        var fieldXid = dijit.byId('selectFieldX')
        this.fieldX = fieldXid.value;
        fieldXid.on("change", lang.hitch(this, function(evt){
            this.fieldX = evt
        }))

        var fieldYid = dijit.byId('selectFieldY')
        this.fieldY = fieldYid.value;
        fieldYid.on("change", lang.hitch(this, function(evt){
            this.fieldY = evt
        }))

        var typeChartId = dijit.byId('_typeChart')
        this.type = typeChartId.value
        typeChartId.on("change", lang.hitch(this, function(evt){
            this.type = evt
        }))

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

        var selectX = dijit.byId('selectFieldX')
        var selectY = dijit.byId('selectFieldY')

        if(selectX.getOptions()){
          selectX.removeOption(selectX.getOptions())
          selectY.removeOption(selectY.getOptions())
          selectX.addOption(map)
          selectY.addOption(map)
        }
      },

      initButton: function(){
        new Button({
          label: this.nls.execute,
          onClick: lang.hitch(this, function(){
              this.gettingLayer()
              this.updateChart(this.type)
          })
        }, "executeChart").startup()
      },

      gettingLayer: function(){
        var query = new Query()
            query.where = "1=1"
            query.returnGeometry = false
            query.outFields = [this.fieldX, this.fieldY]
            new QueryTask(this.url).execute(query, lang.hitch(this, function(results){
              this.render(results)
            }))
      },

      render: function(results){
        var map = results.features.map(lang.hitch(this, function(record){
          return {
            x: record.attributes[this.fieldX],
            y: record.attributes[this.fieldY]
          }
        }))
      
        var labels = map.map(lang.hitch(this, function(record){
          return record.x
        }))
      
        this.chart = new Chart(this.canvas.getContext('2d'), { 
          type: this.type, 
          data: { 
              labels: labels, 
              datasets: [{  
                  label: this.fieldY, 
                  fill: false,
                  backgroundColor: 'rgb(51, 173, 255)', 
                  borderColor: 'rgb(0, 138, 230)', 
                  borderWidth: 1,
                  pointRadius: 2,
                  data: map, 
              }] 
          }, 
          options: {}
         })
      },

      updateChart: function(){ 
        if(this.chart){
          this.chart.destroy()
        }
      }

    /*onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
         //jshint unused:false
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }*/
  });
});