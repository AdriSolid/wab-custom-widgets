define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./ColorStop.html',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/on',
  'dojo/Evented'
], function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
            template, domConstruct, domStyle, on, Evented) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], { //
    dataId: null,
    nls: null,
    color: null, // type: 'esri/Color'
    templateString: template,
    onEdit: null,
    onDelete: null,

    postCreate: function(options) {
      this.inherited(arguments);
      this.setColor(this.color);

      on(this.editColor, 'click', this._editColor.bind(this))
      on(this.removeColor, 'click', this._removeColor.bind(this))
    },

    setColor: function(color) {
      this.color = color;

      var rgba = this.color.toRgba();
      var backgroundColor = 'rgba(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + rgba[3] + ')';
      domStyle.set(this.colorStop, 'background-color', backgroundColor);
    },

    getDataId: function() {
      return this.dataId;
    },

    getColor: function() {
      return this.color;
    },

    _editColor: function() {
      this.onEdit(this, this.color);
    },

    _removeColor: function() {
      this.onDelete(this);
    },
  });
});
