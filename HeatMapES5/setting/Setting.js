define([
    'dojo/_base/declare',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/on',
    'dojo/dom-construct',
    'dojo/dom-attr',
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
    domAttr,
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
      colorCount: 1,
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

      destroy: function() {
        this.inherited(arguments);
        if (this.dndSource) {
          this.dndSource.destroy();
        }
      },

      _initDndSource: function(items) {
        this.dndSource = new Source(this.colorStops);
        this.dndSource.clearItems();
        this.dndSource.on('DndDrop', this._reorderColors.bind(this));

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
      },

      getConfig: function() {
        var ratio = (this.colorList.length > 0) ? 1.0 / (this.colorList.length - 1) : 1.0;

        var colorStops = this.colorList.map( function (colorStop, index) {
          var color = colorStop.getColor().toRgba();
          return {
            ratio: ratio * index,
            color: {r: color[0], g: color[1], b: color[2], a: color[3]}
          }
        });

        return {
          geometry: this.geometry.get('value'),
          colorStops: colorStops
        }
      },

      _setOptions: function(config) {
        var options = this.geometries.map( function (geometry) {

          var label = geometry.label;
          if (geometry.img) {
            label = '<img src="' + this.folderUrl + geometry.img + '" height="12.5" width="12.5"> ' + geometry.label;
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
        var items = config.colorStops.map(function (stop) {
          return new ColorStop({
            dataId: this.colorCount++,
            color: new Color(stop.color),
            nls: this.nls,
            onEdit: this._onEdit.bind(this),
            onDelete: this._onDelete.bind(this),
          })
        }.bind(this));

        this.colorList = items;

        var domNodes = items.map( function(item) {
          domAttr.set(item.domNode, "data-id", item.getDataId())
          return item.domNode;
        })
        this.dndSource.insertNodes(false, domNodes)
      },

      _addNewColor: function() {
        var colorStop = new ColorStop({
          dataId: this.colorCount++,
          color: this.colorPickerColor || new Color(),
          nls: this.nls,
          onEdit: this._onEdit.bind(this),
          onDelete: this._onDelete.bind(this),
        })
        this.colorList.push(colorStop);
        domAttr.set(colorStop.domNode, 'data-id', colorStop.getDataId())
        this.dndSource.insertNodes(false, colorStop.domNode);
      },

      _onEdit: function(colorStop, color) {
        this.selectedColorStop = colorStop;
        this.colorPicker._setColorAttr(color);
        this.colorPickerDialog.show();
      },

      _onDelete: function(colorStop) {
        this.dndSource.deleteSelectedNodes();

        var index = this.colorList.indexOf(colorStop);
        this.colorList.splice(index, 1);
      },

      _reorderColors: function(source, nodes, copy, target) {
        var listOrder = [];
        var childKeys = Object.keys(this.colorStops.childNodes);
        for(var i = 0; i < childKeys.length; i++) {
          var key = childKeys[i];
          listOrder.push(Number(this.colorStops.childNodes[key].getAttribute('data-id')))
        }

        var updateList = [];
        while( this.colorList.length > 0) {
          var idx = listOrder[0];

          for(var j = 0; j < this.colorList.length; j++) {
            if (idx === this.colorList[j].getDataId()) {
              var removedItems = this.colorList.splice(j, 1)

              updateList.push(removedItems[0]);
              listOrder.splice(0, 1);
              j = 0;
              break;
            }
          }
        }

        this.colorList = updateList;
      },

    });
  });


