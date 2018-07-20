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

define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/Evented',
    'libs/echarts/echarts',
    'jimu/utils',
    './_chartUtils',
    './_Gauge',
    './_ChartOptionFactory',
    'libs/echarts/light',
    'libs/echarts/dark'
  ],
  function(declare, _WidgetBase, lang, html, Evented, echarts,
    jimuUtils, chartUtils, Gauge, ChartOptionFactory) {

    return declare([_WidgetBase, Evented], {
      'baseClass': 'jimu-dijit-chart',
      templateString: '<div></div>',
      declaredClass: 'jimu.dijit.chart',
      // constructor -> this.config, this.chartDom

      //public methods:
      //setConfig -> update the option of this.chart.
      //updateConfig -> update this.config's value
      //clear -> Removes all components and charts in this.chart.
      //resize -> Resizes chart, which should be called manually when container size changes.

      //config params:
      // "type": "bar", //"column", "line", "pie", "radar", "funnel", "gauge"
      // "title": "string",
      // "legend": "boolean",
      // "hidexAxis":"boolean",
      // "hideyAxis":"boolean",
      // "confine":boolean,//Whether the tooltip is limited to canvas tag
      // "theme":"",//A registered theme name, light or dark
      // "toolbox": ["saveAsImage", "restore", "dataView", "magicType"],
      // "color":[],//[#fff]
      // "backgroundColor": "#fff",
      // "scale": true, //if stack = true,  force scale = false
      // "dataZoom": ["slider"], //inside
      // "events": [{
      //   "name": "", //"click"、"dblclick"、"mousedown"、"mousemove"、"mouseup"、"mouseover"、"mouseout"
      //   "callback": "function (params) {}"
      // }],
      // "labels": [],
      // "series": [{}], //series:[{name,data:[number or serie obj}]
      // /**pie*/
      // "pieMode": "",//normal,rose
      // "roseType":"",//radius, area
      // "labelLine": "boolean",
      // innerRadius:number,0-50
      // /**bar line colmun*/
      // "stack": 'normal','percent'
      // /* line */
      // area:true
      // "axisPointer": true,
      // /**funnel*/
      // "funnelSort": "descending",
      // /**funnel gauge*/
      // "min": 0,
      // //funnel gauge
      // "max": 100,
      // /**radar*/
      // "radarShape": "circle", //["circle", "polygon"],
      // "indicator": [{}], //{name,max} only for radar
      // /**gauge*/
      // shape:"curved" //horizontal,vertical,curved
      // "gaugeOption": {
      //   "columnColor":"#000",
      //   "bgColor":"",
      //   "valueStyle":{
      //     textStyle:{
      //       color:"#fff",
      //       fontSize:20,
      //       fontWeight:'bold',
      //       fontStyle:'italic',
      //       fontFamily:'Avenir Next'
      //     },
      //     formatter:'function'
      //   },
      //   "labelColor":"#000",
      //   "targetValue:[]",
      //   "showDataRangeLabel":boolean,
      //   "showTargetValueLabel":boolean,
      // },
      // /**advance option*/
      // "advanceOption": {}
      config: null,

      validConfig: {
        type: ['column', 'bar', 'line', 'pie', 'radar', 'funnel', 'gauge'],
        common: ['type', 'title', 'labels', 'legend', 'confine', 'toolbox', 'color', 'theme',
          'backgroundColor', 'scale', 'dataZoom',
          'events', 'series', 'advanceOption'
        ],
        axisChart: ['stack', 'axisPointer', 'hidexAxis', 'hideyAxis', 'area'],
        pie: ['labelLine', 'pieMode', 'roseType', 'innerRadius'],
        funnel: ['min', 'max', 'funnelSort'],
        gauge: ['shape', 'min', 'max', 'gaugeOption'],
        radar: ['radarShape', 'indicator']
      },

      postCreate: function() {
        this.inherited(arguments);
        //init chart domNode box
        var box = this._getChartBox(this.chartDom);
        html.setStyle(this.domNode, {
          width: box.w + 'px',
          height: box.h + 'px'
        });

        //init chart, gauge and chart option factory
        this.chart = echarts.init(this.domNode, this.config.theme || 'light');
        this.gauge = new Gauge({
          chart: this.chart
        });

        this.chartOptionFactory = new ChartOptionFactory({
          chart: this.chart,
          gauge: this.gauge
        });

        this.setConfig();
      },

      updateConfig: function(config) {

        if (!config) {
          return false;
        }

        this.config = lang.mixin(this.config, config);
        var option = this._chartFactory(this.config);
        this.chart.setOption(option, true);
        if (this.config.type === 'gauge' && this.config.shape !== 'curved') {
          this.gauge._resetGraphic(this.config);
        }

        return true;
      },

      setConfig: function(config) {

        if (!config) {
          this.config = this.config || {};
        } else {
          this.config = config;
        }

        if (!this._checkConfig(this.config)) {
          return false;
        }
        this._customTheme();
        this.clear();
        this.chart.setOption(this._chartFactory(this.config));

        this._resizeGridAndGraphicOfGauge();
        return true;
      },

      destroy: function() {
        if (this.config.events && this.config.events[0]) {
          this.config.events.forEach(lang.hitch(this, function(event) {
            this.chart.off(event.name);
          }));
        }
        this.chart.clear();
        this.inherited(arguments);
      },

      _showInitChart: function(config) {
        var chartType;
        if (config.type === 'column' || config.shape === 'horizontal' ||
          config.shape === 'vertical') {
          chartType = 'bar';
        } else {
          chartType = config.type;
        }
        var option = {
          series: [{
            data: [{
              name: '0',
              value: 0
            }]
          }]
        };
        if (chartUtils.isAxisChart(config)) {
          option.xAxis = {
            data: ["0"]
          };
          option.yAxis = {};
        }
        option.series[0].type = chartType;
        this.chart.setOption(option, false);
      },

      _chartFactory: function(config) {

        //show init chart for calcute
        if (!config.shape) {
          this._showInitChart(config);
        }
        this.option = this.chartOptionFactory.produceOption(config);
        this._bindEvents(config);
        return this.option;
      },

      clear: function() {
        this.chart.clear();
      },

      resize: function(width, height) {
        html.setStyle(this.domNode, {
          width: width || '100%',
          height: height || '100%'
        });
        this.chart.resize();
        //data zoom
        this._resizeDataZoom();
        this._resizeGridAndGraphicOfGauge();
      },

      _getChartBox: function() {
        var box = {
          w: 10,
          h: 10
        };

        if (this.chartDom) {
          var chartBox = html.getMarginBox(this.chartDom);
          if (chartBox.w !== 0) {
            box.w = chartBox.w;
          }
          if (chartBox.h !== 0) {
            box.h = chartBox.h;
          }
        }
        return box;
      },

      _resizeDataZoom: function() {
        var option = this.option;
        var config = this.config;
        option = this.chartOptionFactory.settingDataZoom(option, config);
        this.chart.setOption(option);
      },

      _bindEvents: function(config) {
        if (config.events && config.events[0]) {
          config.events.forEach(lang.hitch(this, function(event) {
            this.chart.on(event.name, event.callback);
          }));
        }
      },

      _resizeGridAndGraphicOfGauge: function() {
        if (this.config.type === 'gauge' && this.config.shape !== 'curved') {
          this.gauge._resetGrid(this.config);
          this.gauge._resetGraphic(this.config);
        }
      },

      _customTheme: function() {
        if (!this.chart._theme) {
          this.chart._theme = {};
        }
        //color
        // if (this.config.color && this.config.color[0]) {
        //   this.chart._theme.color = this.config.color;
        // }
        //tooltip
        if (!this.chart._theme.tooltip) {
          this.chart._theme.tooltip = {};
        }
        //tooltip
        if (this.config.confine) {
          this.chart._theme.tooltip.confine = true;
        }
        //tooltip 1.axisPointer
        this.chart._theme.tooltip.axisPointer = {
          type: 'cross',
          label: {
            show: true,
            precision: 2,
            formatter: function(params) {
              if (typeof params.value === 'number') {
                var value = parseFloat(params.value).toFixed(2);
                return chartUtils.tryLocaleNumber(value);
              } else {
                return params.value;
              }
            }
          },
          lineStyle: {
            color: '#27727B',
            type: 'dashed'
          },
          crossStyle: {
            color: '#27727B'
          },
          shadowStyle: {
            color: 'rgba(200,200,200,0.3)'
          }
        };
        //value axis
        if (!this.chart._theme.valueAxis) {
          this.chart._theme.valueAxis = {};
        }
        if (!this.chart._theme.valueAxis.axisLabel) {
          this.chart._theme.valueAxis.axisLabel = {};
        }
        this.chart._theme.valueAxis.axisLabel.formatter = function(value) {
          return jimuUtils.localizeNumber(value);
        };
      },

      _checkConfig: function(config) {
        var isValidConfig = true;
        if (!config) {
          console.error('Empty config');
          isValidConfig = false;
        }
        if (!config.type || this.validConfig.type.indexOf(config.type) < 0) {
          console.error('Invaild chart type!');
          isValidConfig = false;
        }
        var validConfig = lang.clone(this.validConfig);
        var commonConfig = validConfig.common;
        var validOption = [];
        if (config.type === 'column' || config.type === 'bar' || config.type === 'line') {
          validOption = commonConfig.concat(validConfig.axisChart);
        } else {
          validOption = commonConfig.concat(validConfig[config.type]);
        }
        var keys = Object.keys(config);
        keys.forEach(function(key) {
          if (validOption.indexOf(key) < 0) {
            isValidConfig = false;
            console.error('Invalid configuration parameter: ' + key);
          }
        });
        return isValidConfig;
      }

    });
  });