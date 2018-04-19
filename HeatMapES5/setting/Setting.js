define([
    'dojo/_base/declare',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/on',
    'dojo/dom-construct',
    'dojo/dnd/Source',
    'esri/Color',
    './ColorStop',

    // for parser
    'dijit/form/Select',
    'esri/dijit/ColorPicker',
    'dijit/ConfirmDialog',
    'dojo/domReady!'
  ],
  function(
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin,
    on,
    domConstruct,
    Source,
    Color,
    ColorStop
    ) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-heat-map-setting',
      geometries: [
        { value: '*', label: '*'},
        { value: 'point', label: 'Point', img: 'images/point_layer.png'},
        { value: 'polygon', label: 'Polygon', img: 'images/polygon_layer.png'},
        { value: 'line', label: 'Line', img: 'images/line_layer.png'},
        { value: 'multiPatch', label: 'Multi patch'}
      ],
      dndSource: null,

      selectedColorStop: null,
      colorCount: 0,
      colorList: [],
      colorPickerColor: null,

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);

        this._initDndSource();
        this._initColorPicker();
        this._initAddColor();
        this.setConfig(this.config);
      },

      _initDndSource: function(items) {
        this.dndSource = new Source(this.colorStops);
        this.dndSource.clearItems();
        this.dndSource.on('DndDrop', function(evt) {console.log(evt)});

        if (items) {
          this.dndSource.insertNodes(false, items);
        }
      },

      _initColorPicker: function() {
        this.colorPickerDialog.on('hide', function() {});
        this.colorPickerDialog.on('execute', this._setColor.bind(this))
        this.colorPickerDialog.on('cancel', this._cancelDialog.bind(this))
        this.colorPicker.on('color-change', this._colorChange.bind(this))
      },

      _initAddColor: function() {
        on(this.addColor, 'click', this._addNewColor.bind(this));
      },

      _colorChange: function(evt) {
        this.colorPickerColor = new Color(evt.color);
      },

      _setColor: function() {
        this.selectedColorStop.setColor(this.colorPickerColor);
        this.selectedColorStop = null;
      },

      _cancelDialog: function () {
        this.selectedColorStop = null;
      },

      setConfig: function(config) {
        if (Object.prototype.toString.call(config) !== '[object Object]') {
          return;
        }

        this.config = config;
        this._setOptions(config);
        this._setColorStops(config);

        //this.colorStops.set('value', this.config.description);
      },

      getConfig: function() {
        return {
          geometry: this.geometry.get('value'),
          colorStops: this.config.colorStops
        }
      },

      _setOptions: function(config) {
        var options = this.geometries.map( function (geometry) {

          var label = geometry.label;
          if (geometry.img) {
            label = '<img src="' + this.folderUrl + geometry.img + ' height="12.5" width="12.5"> ' + geometry.label;
          }

          return domConstruct.create('option', {
            label: label,
            value: geometry.value,
            selected: config.geometry === geometry.value
          });
        }.bind(this))

        this.geometry.removeOption(this.geometry.getOptions())
        this.geometry.addOption(options)
      },


      _setColorStops: function(config) {
        console.log("_setColorStops")


        var items = config.colorStops.map(function (stop) {
          return new ColorStop({
            id: this.colorCount++,
            color: new Color(stop.color),
            nls: this.nls,
            onEdit: this._onEdit.bind(this),
            onDelete: this._onDelete.bind(this),
          })
        }.bind(this));

        this.colorList.push(items);

        var domNodes = items.map( function(item) {return item.domNode;})

        console.log("adding items")
        //domConstruct.place(layerItem.domNode, div);
        this.dndSource.insertNodes(false, domNodes)
      },

      _addNewColor: function() {
        var colorStop = new ColorStop({
          id: this.colorCount++,
          color: this.colorPickerColor || new Color(),
          nls: this.nls,
          onEdit: this._onEdit.bind(this),
          onDelete: this._onDelete.bind(this),
        })
        this.colorList.push(colorStop);
        this.dndSource.insertNodes(false, colorStop.domNode);
      },

      _onEdit: function(colorStop, color) {
        this.selectedColorStop = colorStop;
        this.colorPicker._setColorAttr(color);
        this.colorPickerDialog.show();
      },

      _onDelete: function(colorStop) {
        console.log(colorStop)

        //this.dndSource.removeNode(colorStop.domNode)
        this.dndSource.deleteSelectedNodes();

        var index = this.colorList.indexOf(colorStop);
        this.colorList.splice(index, 1);
      },

    });
  });


