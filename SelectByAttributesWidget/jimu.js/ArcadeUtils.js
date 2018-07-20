///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/array',
        'jimu/LayerStructure'
        ],
function(declare,
          lang,
          array,
          LayerStructure) {
  return declare([], {
    declaredClass: 'ArcadeUtils',
    map: null,
    constructor : function(/*Object*/args) {
      declare.safeMixin(this, args);
    },

    getArcadeRender: function(args) {
      return {ArcadeRender: this._lookupArcadeRender({layers:this._checkPassInLayer(args)})};
    },

    getArcadeInfoTemplate: function(args) {
      return {ArcadeInfoTemplate: this._lookupArcadeInfoTemplate({layers:this._checkPassInLayer(args)})};
    },

    getArcadeLabel: function(args) {
      return {ArcadeLabel: this._lookupArcadeLabel({layers:this._checkPassInLayer(args)})};
    },

    getAllArcade: function(args) {
      var infoTemplate = this.getArcadeInfoTemplate(args);
      var render = this.getArcadeRender(args);
      var label = this.getArcadeLabel(args);
      var arcadeObj = Object.assign(infoTemplate, render, label);
      return arcadeObj;
    },

    _checkPassInLayer: function(args) {
      var layerList = [];
      if(typeof(args) !== 'undefined') {
        if(typeof(args.layer) !== 'undefined') {
          if((args.layer !== null) && (args.layer !== '')) {
            //layerList.push(args.layer);
            layerList = this._getAllMapLayers(args);
          } else {
            layerList = this._getAllMapLayers();
          }
        } else {
          layerList = this._getAllMapLayers();
        }
      } else {
        layerList = this._getAllMapLayers();
      }
      return layerList;
    },

    //This gets all the operational layers and gets the info and places it in a custom data object.
    _getAllMapLayers: function(args) {
      var lookupId = "";
      var layerList = [];
      var layerStructure = LayerStructure.getInstance();
      if(typeof(args) !== 'undefined') {
        lookupId = args.layer;
      }
      if(lookupId !== "") {
        var foundLayer = layerStructure.getNodeById(lookupId);
        if(foundLayer !== 'undefined') {
          layerList.push(foundLayer._layerInfo.layerObject);
        }
      } else {
        //No layer ID passed in, just get all layers.
        layerStructure.traversal(function(layerNode) {
          //check to see if type exist and if it's not any tiles
          if(typeof(layerNode._layerInfo.layerObject.type) !== 'undefined') {
            if((layerNode._layerInfo.layerObject.type).indexOf("tile") === -1) {
              layerList.push(layerNode._layerInfo.layerObject);
            }
          } else {
          //It is a grouped Map service
            layerList.push(layerNode._layerInfo.layerObject);
          }
        });
      }
      return layerList;
    },

    _lookupArcadeRender: function(args) {
      var lyrArcadeExpr = [];
      if(args.layers.length > 0) {
        array.forEach(args.layers, lang.hitch(this, function(layer) {
          var expObj= {};
          //Only add if there is a renderer object, maps services do not have this.
          if(typeof(layer.renderer) != 'undefined') {
            var lyrObjRender = layer.renderer;
            if(typeof(lyrObjRender.valueExpression) !== 'undefined') {
              expObj.layer = layer.id;
              expObj.valueExpression =  lyrObjRender.valueExpression;
              expObj.valueExpressionTitle =  lyrObjRender.valueExpressionTitle;
              if(typeof(lyrObjRender.values) !== 'undefined') {
                expObj.values =  lyrObjRender.values;
              }
              if(typeof(lyrObjRender.visualVariables) !== 'undefined') {
                expObj.visualVariables = lyrObjRender.visualVariables;
              }
            }
            if(Object.keys(expObj).length > 1 && expObj.constructor === Object) {
              lyrArcadeExpr.push(expObj);
            }
          }
        }));
      }
      return lyrArcadeExpr;
    },

    _lookupArcadeInfoTemplate: function(args) {
      var lyrArcadeExpr = [];
      if(args.layers.length > 0) {
        array.forEach(args.layers, lang.hitch(this, function(layer) {
          var expObj= {};
          //InfoTemplate handling for feature layers
          if(typeof(layer.infoTemplate) !== 'undefined') {
            if(typeof(layer.infoTemplate.info.expressionInfos) !== 'undefined') {
              if(layer.infoTemplate.info.expressionInfos.length > 0) {
                expObj.layer = layer.id;
                expObj.expressionInfos =  layer.infoTemplate.info.expressionInfos;
              }
            }
          } else {
            //feature handling for map service
            if(typeof(layer.infoTemplates) !== 'undefined') {
              //check if it template is arcade and only store it if it is.
              //Arcade is stored in the group level, not sublayers
              for (var key in layer.infoTemplates) {
                if ((layer.infoTemplates).hasOwnProperty(key)) {
                  if(typeof(layer.infoTemplates[key].infoTemplate.info.expressionInfos) !== 'undefined') {
                    var arcadeNode = layer.infoTemplates[key].infoTemplate;
                    if(arcadeNode.info.expressionInfos.length > 0) {
                      expObj.layer = layer.id;
                      expObj.expressionInfos =  arcadeNode.info.expressionInfos;
                    }
                  }
                }
              }
            } else {
              //no infoTemplates defined
            }
          }
          if(Object.keys(expObj).length > 1 && expObj.constructor === Object) {
            lyrArcadeExpr.push(expObj);
          }

        }));
      }
      return lyrArcadeExpr;
    },

    _lookupArcadeLabel: function(args) {
      var lyrArcadeExpr = [];
      if(args.layers.length > 0) {
        array.forEach(args.layers, lang.hitch(this, function(layer) {
          var expObj= {};
          var lyrObj = layer;
          if(typeof(lyrObj.labelingInfo) !== 'undefined') {
            array.forEach(lyrObj.labelingInfo, lang.hitch(this, function(label) {
              //check if 'name' exists, it is present when Arcade is used
              if(typeof(label.name) !== 'undefined') {
                expObj.layer = layer.id;
                expObj.labelingInfo =  label;
              }
            }));
          }
          if(Object.keys(expObj).length > 1 && expObj.constructor === Object) {
            lyrArcadeExpr.push(expObj);
          }
        }));
      }
      return lyrArcadeExpr;
    }
  });
});
