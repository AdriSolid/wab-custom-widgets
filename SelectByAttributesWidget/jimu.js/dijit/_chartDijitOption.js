define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/on',
  'dojo/_base/lang',
  'dojo/Deferred',
  'esri/layers/FeatureLayer',
  'jimu/clientStatisticsUtils',
  'jimu/_chartHelpUtils'
], function(declare, _WidgetBase, on, lang, Deferred, FeatureLayer, clientStatisticsUtils,
  ChartHelpUtils) {

  return declare([_WidgetBase], {
    //options
    //map

    //STD means statistics data

    //public methods

    //getChartOption
    //getChartOptionWithData

    //getLoadedLayer

    //getLoadedLayerForSTD
    //mockLayerDefinitionForSTD

    postMixInProperties: function() {
      this.nls = window.jimuNls.statisticsChart;
    },

    constructor: function(options) {
      this.map = options.map;
      this.chartHelpUtils = new ChartHelpUtils({
        map: this.map,
        clientStatisticsUtils: clientStatisticsUtils
      });
    },

    //--options--

    //--options.infos--
    // "layerDefinition": null,
    // "popupFieldInfos": null,
    // "features": [],
    // "featureLayerForChartSymbologyChart": null

    // --options.chartConfig--

    // "mode": "feature",
    // "type": "column",
    // "labelField": "OBJECTID",
    // "valueFields": ["POP2000", "POP2007"],
    // "sortOrder": {
    //   "isAsc": true,
    //   "field": "OBJECTID",
    //   "isLabelAxis": true
    // },
    // "backgroundColor": "transparent",
    // "colors": [],
    // "showLegend": false,
    // "legendTextColor": "#333333",
    // "legendTextSize": 12,
    // "stack": "percent",
    // "showHorizontalAxis": true,
    // "horizontalAxisTextColor": "#333333",
    // "horizontalAxisTextSize": 12,
    // "showVerticalAxis": true,
    // "verticalAxisTextColor": "#333333",
    // "verticalAxisTextSize": 12
    getChartOption: function(options, chart, forExtraSTD, hasStatisticsed) {

      var splitOption = this.chartHelpUtils.getClientStatisticUtilsOptions(options,
        forExtraSTD, hasStatisticsed);

      //handle layer definition and popupinfo for chart statistics utils
      var layerOption = splitOption.layerOption;
      if (layerOption.featureLayer) {
        this.chartHelpUtils.setLayerFeatureLayer(layerOption.featureLayer);
      }
      if (layerOption.popupFieldInfos) {
        this.chartHelpUtils.setPopupInfo(layerOption.popupFieldInfos);
      }
      var csuOptions = splitOption.csuOptions;
      var data = this._getClientStatisticsData(csuOptions);

      //remove invaild feature, for bind enent
      options.features = options.features.filter(function(feature) {
        return !!feature.attributes;
      });
      this.chartHelpUtils.bindChartEvent(chart, options, data);

      return this.getChartOptionWithData(options, data);
    },

    // return {label:'', values:[2000], features:[f1,f2...], unit /*optional*/}
    _getClientStatisticsData: function(csuOptions) {
      //init: get statistics data
      var data = clientStatisticsUtils.getClietStatisticsData(csuOptions);
      //sort:
      data = clientStatisticsUtils.sortClientStatisticsData(data, csuOptions);
      //max number categories
      data = clientStatisticsUtils.getDataForMaxLabels(data, csuOptions.maxLabels);
      //keep value best decimal places
      data = this.chartHelpUtils.keepStatisticsDataBestDecimalPlace(csuOptions, data, csuOptions.mode);
      return data;
    },

    //return a feature layer
    getLoadedLayer: function(featureLayerOrUrlOrLayerDefinition) {
      return this._getLoadedLayer(featureLayerOrUrlOrLayerDefinition);
    },

    //get the chart option for jimu/dijit/Chart.js
    //return Chart.js's option
    getChartOptionWithData: function(options, data) {
      var chartSeriesOption = this.createOptionSeries(options, data);
      this._assigneeSettingColorToSeries(chartSeriesOption, options);
      //update chartSeriesOption.series[i].name & series[i].data[i].name
      var chartConfig = options.chartConfig;
      this.chartHelpUtils.updateChartSeriesDisplayName(chartSeriesOption, chartConfig);
      //TODO mixin series style
      return this._mapSettingConfigToChartOption(chartSeriesOption, options);
    },

    _assigneeSettingColorToSeries: function(optionSeries, options) {
      if (!optionSeries || !optionSeries.series) {
        return optionSeries;
      }
      var chartConfig = options.chartConfig;
      var featureLayerForChartSymbologyChart = options.featureLayerForChartSymbologyChart;

      this.chartHelpUtils.assigneeSettingColor(chartConfig, optionSeries.series,
        featureLayerForChartSymbologyChart);
    },

    createOptionSeries: function(options, data) {
      //data: [{label:'a',values:[10,100,2],features:[f1,f2...]}]

      // --type: bar line pie --
      var chartConfig = options.chartConfig;
      var type = chartConfig.type;
      var mode = chartConfig.mode;

      var valueFields = chartConfig.valueFields;

      var seriesNames = [];
      if (mode === 'count') {
        seriesNames = ['']; //this.nls.count
      } else if (mode === 'field') {
        seriesNames = ['']; //this.nls.field ?
      } else {
        seriesNames = lang.clone(valueFields);
      }

      var chartOptions = null;

      chartOptions = {
        type: type,
        labels: [],
        series: []
      };

      chartOptions.series = seriesNames.map(lang.hitch(this, function(sreieName) {

        var item = {
          name: sreieName,
          type: type,
          data: []
        };
        return item;
      }));

      data.forEach(lang.hitch(this, function(item) {
        //item: {label:'a',values:[10,100,2],...}
        var label = item.label;
        chartOptions.labels.push(label);
        for (var i = 0; i < item.values.length; i++) {
          var value = item.values[i];
          var dataItem = {
            value: value,
            name: label,
            unit: item.unit
          };
          //Field mode
          if (item.features) {
            dataItem.features = item.features;
          }
          chartOptions.series[i].data.push(dataItem);
        }
      }));

      return chartOptions;
    },

    //mock feature layer for STD(statistics data of framework data)
    getLoadedLayerForSTD: function(dataSchema, chartConfig) {
      var mockDefinition = this.mockLayerDefinitionForSTD(dataSchema, chartConfig);
      return this._getLoadedLayer(mockDefinition);
    },

    //mock a layer definition object
    mockLayerDefinitionForSTD: function(dataSchema, config) {
      /*dataSchema: {
          groupByFields: ['POP_CLASS'],
          fields: [{
            name: 'POP',
            type: 'esriFieldTypeInteger',
            alias: 'POP'
          }, {
            name: 'POP_RANK',
            type: 'esriFieldTypeInteger',
            alias: 'POP_RANK'
          }, {
            name: 'POP_CLASS',
            type: 'esriFieldTypeString',
            alias: 'POP_CLASS'
          }]
        }
        */
      var mockDefinition = {
        type: 'Table',
        fields: [] //{name,type,alias}
      };
      var originalFieldInfos = dataSchema.fields;
      var mode = config.mode;
      //fields
      if (mode === 'category' || mode === 'field') {
        /*
        category mode:
        config: {
          mode: 'category',
          categoryField: 'POP_CLASS',
          valueFields: ['POP', 'POP_RANK'],
          operation: 'sum'
        }

        field mode:
        config: {
          mode: 'field',
          valueFields: ['POP_RANK', 'LABEL_FLAG'],
          operation: 'sum'
        }
        */
        mockDefinition.fields = dataSchema.fields;
      } else if (mode === 'count') {
        /*
          config: {
            mode: 'count',
            categoryField: 'POP_CLASS'
          }

          mockDefinition: {
            type: 'Table',
            fields: [{
              name: 'POP_CLASS',
              type: 'esriFieldTypeString',
              alias: 'POP_CLASS'
            }, {
              name: 'POP_count',
              type: 'esriFieldTypeInteger',
              alias: 'count'
            }]
          }*/
        var countField = "STAT_COUNT"; //For HANA, count --> STAT_COUNT
        mockDefinition.fields.push({
          name: countField,
          type: 'esriFieldTypeInteger',
          alias: this.nls.count
        });
      }

      //category field
      if (mode === 'category' || mode === 'count') {
        originalFieldInfos.some(lang.hitch(this, function(originalFieldInfo) {
          if (originalFieldInfo.name === config.categoryField) {
            mockDefinition.fields.push(originalFieldInfo);
            return true;
          } else {
            return false;
          }
        }));
      }

      return mockDefinition;
    },

    _getLoadedLayer: function(featureLayerOrUrlOrLayerDefinition) {
      var def = new Deferred();
      var featureLayer = null;
      if (typeof featureLayerOrUrlOrLayerDefinition === 'string') {
        //url
        featureLayer = new FeatureLayer(featureLayerOrUrlOrLayerDefinition);
      } else {
        if (featureLayerOrUrlOrLayerDefinition.declaredClass === "esri.layers.FeatureLayer") {
          //FeatureLayer
          featureLayer = featureLayerOrUrlOrLayerDefinition;
        } else {
          //layerDefinition
          featureLayer = new FeatureLayer({
            layerDefinition: lang.clone(featureLayerOrUrlOrLayerDefinition),
            featureSet: null
          });
        }
      }

      if (featureLayer.loaded) {
        def.resolve(featureLayer);
      } else {
        this.own(on(featureLayer, 'load', lang.hitch(this, function() {
          def.resolve(featureLayer);
        })));
      }

      return def;
    },

    //generate Chart.js's option
    _mapSettingConfigToChartOption: function(chartOptions, options, theme) {
      var chartConfig = options.chartConfig;

      var type = chartConfig.type;
      var mode = chartConfig.mode;
      var axisTypes = ['column', 'bar', 'line'];
      var mixinOptions = {
        type: type,
        dataZoom: ["inside", "slider"],
        confine: true,
        backgroundColor: chartConfig.backgroundColor,
        legend: chartConfig.showLegend,
        theme: theme || "light",
        advanceOption: function(options) {
          //legend text color and font size
          if (chartConfig.showLegend) {
            if (options.legend) {
              if (!options.legend.textStyle) {
                options.legend.textStyle = {};
              }
              options.legend.textStyle.color = chartConfig.legendTextColor;
              options.legend.textStyle.fontSize = chartConfig.legendTextSize;
            }
          }
          //pie label text color and font size
          if (type === 'pie') {
            if (options.series && options.series.length > 0) {
              options.series.forEach(lang.hitch(this, function(item) {
                if (item.type === 'pie') {
                  if (!item.label) {
                    item.label = {};
                  }
                  if (!item.label.normal) {
                    item.label.normal = {};
                  }
                  item.label.normal.show = chartConfig.showDataLabel;
                  if (!item.label.normal.textStyle) {
                    item.label.normal.textStyle = {};
                  }
                  item.label.normal.textStyle.color = chartConfig.dataLabelColor;
                  item.label.normal.textStyle.fontSize = chartConfig.dataLabelSize;
                }
              }));
            }
          } else {
            //xAxis text color and font size
            if (!options.xAxis) {
              options.xAxis = {};
            }
            // options.xAxis.show = displayConfig.showHorizontalAxis;
            if (!options.xAxis.axisLabel) {
              options.xAxis.axisLabel = {};
            }
            if (!options.xAxis.axisLabel.textStyle) {
              options.xAxis.axisLabel.textStyle = {};
            }
            options.xAxis.axisLabel.textStyle.color = chartConfig.horizontalAxisTextColor;
            options.xAxis.axisLabel.textStyle.fontSize = chartConfig.horizontalAxisTextSize;

            //yAxis text color and font size
            if (!options.yAxis) {
              options.yAxis = {};
            }
            // options.yAxis.show = displayConfig.showVerticalAxis;
            if (!options.yAxis.axisLabel) {
              options.yAxis.axisLabel = {};
            }
            if (!options.yAxis.axisLabel.textStyle) {
              options.yAxis.axisLabel.textStyle = {};
            }
            options.yAxis.axisLabel.textStyle.color = chartConfig.verticalAxisTextColor;
            options.yAxis.axisLabel.textStyle.fontSize = chartConfig.verticalAxisTextSize;
          }
        }
      };

      if (type === 'pie') {
        //pie chart, assignee color array to series
        if (mode !== 'field') {
          var seriesStyle = chartConfig.seriesStyle;
          if (seriesStyle && seriesStyle.styles && seriesStyle.styles[0]) {
            var matchStyle = seriesStyle.styles[0].style;
            if (matchStyle && Array.isArray(matchStyle.color)) {
              var colors = lang.clone(matchStyle.color);
              if (colors.length === 2) {
                colors = this.chartHelpUtils.getColors(lang.clone(matchStyle.color), 6);
              }
              mixinOptions.color = colors;
            }
          }
        }
        //pie chart inner radius and label line
        mixinOptions.innerRadius = chartConfig.innerRadius;
        mixinOptions.labelLine = !!chartConfig.showDataLabel;
      } else if (axisTypes.indexOf(type) > -1) {
        //axis cahrt, set stack and area

        //stack
        if (!chartConfig.stack) {
          chartConfig.stack = false;
        }
        if ((type === 'column' || type === 'bar') || (type === 'line' && chartConfig.area)) {
          mixinOptions.stack = chartConfig.stack;
        }
        //area
        if (type === 'line' && !chartConfig.area) {
          chartConfig.area = false;
        }

        if (type === 'line') {
          mixinOptions.area = chartConfig.area;
        }
        //axisPointer, scale, hidexAxis, hideyAxis
        chartOptions.axisPointer = true;
        chartOptions.scale = false;
        chartOptions.hidexAxis = !chartConfig.showHorizontalAxis;
        chartOptions.hideyAxis = !chartConfig.showVerticalAxis;
      }

      lang.mixin(chartOptions, mixinOptions);
      return chartOptions;
    }

  });
});