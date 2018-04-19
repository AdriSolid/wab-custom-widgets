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
    id: null,
    nls: null,
    color: null, // type: esri/Color!
    templateString: template,
    onEdit: null,
    onDelete: null,

    pickerListener: null,

    //constructor: function(options) {
    //  this.nls = options.nls;
    //  this.color = options.color;
    //},

    postCreate: function(options) {
      this.inherited(arguments);
      this.setColor(this.color);
      on(this.editColor, 'click', this._editColor.bind(this))
      on(this.removeColor, 'click', this._removeColor.bind(this))
    },

    setColor: function(color) {
      console.log("setColor")
      this.color = color;
      domStyle.set(this.colorStop, 'background-color', this.color.toRgba());
    },

    getColor: function() {
      return this.color;
    },

    _editColor: function() {
      console.log("edit color")
      this.onEdit(this, this.color);
    },

    _removeColor: function() {
      console.log("remove color")
      this.onDelete(this);
    },
  });
});
