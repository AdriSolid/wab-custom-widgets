define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  './_chartUtils'
], function(declare, lang, chartUtils) {
  return declare([], {

    constructor: function(option) {
      this.chart = option.chart;
      this.gauge = option.gauge;
    },

    produceOption: function(config) {
      if (!this.chart._theme) {
        this.chart._theme = {};
      }
      config = lang.clone(config);
      config = this._mockChartDataWhenNoData(config);
      var option = {};

      //axis chart grid
      option = this._settingDefaultGrid(option, config);
      //render option
      option = this._settingRenderOption(option, config);
      //background color
      option = this._settingBackgroundColor(option, config);
      //display color
      option = this._settingColor(option, config);
      //tooltip
      option = this._settingToolTip(option, config);
      //For column bar line chart
      option = this._settingAxisChartAxis(option, config);

      option = this._settingRadar(option, config);
      //series
      option = this._settingSeries(option, config);
      //stack
      option = this._settingStack(option, config);
      //line area
      option = this._settingArea(option, config);
      //axis display
      option = this._settingAxisDisplay(option, config);
      //legend
      option = this._settingLegend(option, config);
      //scale
      option = this._settingScale(option, config);
      //rtl
      option = this._handleChartRtl(option, config);
      //avoid pie overlap legend and label
      option = this._pieChartAvoidLegendLabelOverLap(option, config);
      //datazoom
      option = this.settingDataZoom(option, config);
      //Grid
      option = this._settingGrid(option, config);
      //advance option
      option = this._settingAdvanceOption(option, config);
      //avoid adjoining pie part the same color
      option = this._avoidAdjoiningColorSameForPie(option, config);

      return option;
    },

    _mockChartDataWhenNoData: function(config) {
      if (config && Array.isArray(config.labels) && config.labels.length === 0) {
        config.labels.push(0);
      }
      if (config && Array.isArray(config.series) && config.series.length > 0) {
        config.series.forEach(function(serie) {
          if (serie && Array.isArray(serie.data) && serie.data.length === 0) {
            serie.data.push(0);
          }
        });
      }
      return config;
    },

    _settingAdvanceOption: function(option, config) {
      if (config.advanceOption) {
        if (typeof config.advanceOption === 'object') {
          lang.mixin(option, config.advanceOption);
        } else if (typeof config.advanceOption === 'function') {
          config.advanceOption(option);
        }
      }
      return option;
    },

    _avoidAdjoiningColorSameForPie: function(option, config) {
      if (config.type !== 'pie' || !option.color || option.color.length <= 2) {
        return option;
      }
      if (option.series && option.series[0]) {
        option.series.forEach(lang.hitch(this, function(item) {
          var pieCount = item.data.length;
          if ((pieCount - 1) % (option.color.length) === 0) {
            var lastPart = item.data[pieCount - 1];
            if (!lastPart.itemStyle) {
              lastPart.itemStyle = {};
            }
            if (!lastPart.itemStyle.normal) {
              lastPart.itemStyle.normal = {};
            }
            if (!lastPart.itemStyle.normal.color) {
              lastPart.itemStyle.normal.color = option.color[1];
            }
          }
        }));
      }
      return option;
    },

    _settingDefaultGrid: function(option, config) {
      if (chartUtils.isAxisChart(config)) {
        option.grid = {
          top: 20,
          bottom: 10,
          left: 10,
          right: 10,
          containLabel: true
        };
      }
      return option;
    },

    _settingRenderOption: function(option, config) {
      if (config.shape === 'curved') {
        option.animationThreshold = 99999999;
        option.hoverLayerThreshold = 99999;
        option.progressiveThreshold = 99999;
        return option;
      }
      //Chart render option
      option.hoverLayerThreshold = 500;
      option.progressiveThreshold = 500;
      option.progressive = 100;
      option.animationThreshold = 500;
      return option;
    },

    _settingBackgroundColor: function(option, config) {
      if (config.backgroundColor) {
        option.backgroundColor = config.backgroundColor;
      }
      return option;
    },

    _settingColor: function(option, config) {
      if (config.color && config.color[0]) {
        if (!this.chart._theme) {
          this.chart._theme = {};
        }
        this.chart._theme.color = config.color;
        option.color = config.color;
      }
      return option;
    },

    _settingToolTip: function(option, config) {
      option.tooltip = {};
      if (config.confine) {
        option.tooltip.confine = true;
      }
      if (config.type === 'radar') {
        option.tooltip.trigger = 'item';
        return option;
      }
      if (config.axisPointer) {
        option.tooltip.trigger = 'axis';
        if (config.type === 'column' || config.type === 'bar') {
          option.tooltip.axisPointer = {
            type: 'shadow'
          };
        }
      } else {
        option.tooltip.axisPointer = {
          type: ''
        };
      }
      //theme tooltip formatter
      if (!this.chart._theme.tooltip) {
        this.chart._theme.tooltip = {};
      }

      var isPercent = false;
      if (config.stack === 'percent') {
        isPercent = true;
      }

      this.chart._theme.tooltip.formatter = function(params) {
        return chartUtils.handleToolTip(params, null, false, isPercent);
      }.bind(this);

      return option;
    },

    _settingAxisChartAxis: function(option, config) {
      if (!chartUtils.isAxisChart(config)) {
        return option;
      }
      option.xAxis = {};
      option.yAxis = {};
      //setting value labels and category labels
      if (config.type === 'column' || config.type === 'line' && config.labels) {
        option.xAxis.data = config.labels;
        option.xAxis.type = 'category';
        option.yAxis.type = 'value';
      } else if (config.type === 'bar' && config.labels) {
        option.yAxis.data = config.labels;
        option.yAxis.type = 'category';
        option.xAxis.type = 'value';
      }
      return option;
    },

    _settingSeries: function(option, config) {
      if (config.type === 'gauge') {
        return this.gauge._settingGaugeSeries(option, config);
      }
      var handledSeries = null;
      var series = config.series;
      series.forEach(function(serie) {
        // if series.type is not defined, set as config.type
        if (!serie.type) {
          serie.type = config.type;
        }
        serie.type = config.type === 'column' ? 'bar' : config.type;
      });
      if (!series.keek) {
        handledSeries = [];
        handledSeries = series.map(lang.hitch(this, function(serie) {
          serie.data = serie.data.map(lang.hitch(this, function(item, i) {
            var dataObj = null;
            if (config.type === 'funnel' || config.type === 'gauge' || config.type === 'pie') {
              dataObj = {};
              if (!item && typeof item !== 'number') {
                dataObj.value = item;
              } else {
                if (typeof item.value !== 'undefined') {
                  dataObj.value = item.value;
                } else {
                  dataObj.value = item;
                }
                //unique color
                if (item.itemStyle) {
                  if (!dataObj.itemStyle) {
                    dataObj.itemStyle = {};
                  }
                  dataObj.itemStyle = lang.mixin(dataObj.itemStyle, item.itemStyle);
                }
              }
              dataObj.name = config.labels[i] || '';

            } else if (config.type === 'column' || config.type === 'bar' || config.type === 'line') {
              if (!item) {
                return item;
              }
              dataObj = item;
            }
            if (dataObj && dataObj.itemStyle && dataObj.itemStyle.normal &&
              typeof dataObj.itemStyle.normal.color !== 'undefined' && config.type !== 'line') {
              if (config.stack) {
                this._showBarBorderColor = 'stack';
              } else {
                this._showBarBorderColor = 'single';
              }
            } else {
              this._showBarBorderColor = false;
            }
            return dataObj;
          }));

          //pie
          serie = this._settingPieSerie(serie, config);
          //funnel
          serie = this._settingFunnelSerie(serie, config);
          //radar
          serie = this._settingRaderSerie(serie, config);

          return serie;
        }));
      } else {
        handledSeries = series;
      }
      option.series = handledSeries;
      option = this._handleChartBorderWidthColor(option, config);
      return option;
    },

    _settingRaderSerie: function(serie, config) {
      if (serie.type !== 'radar') {
        return serie;
      }
      // serie.label = {
      //   normal: {
      //     show: true,
      //     formatter: function(params) {
      //       return chartUtils.tryLocaleNumber(params.value);
      //     }
      //   }
      // };
      var indicator = config.indicator.map(function(item) {
        return item.name;
      });
      serie.tooltip = {};
      serie.tooltip.formatter = function(params) {
        return chartUtils.handleToolTip(params, null, false, false, indicator);
      };
      return serie;
    },

    _settingFunnelSerie: function(serie, config) {
      if (serie.type !== 'funnel') {
        return serie;
      }
      serie.minSize = '0%';
      serie.maxSize = '100%';
      serie.sort = 'descending'; //ascending
      serie.min = config.min || 0;
      serie.max = config.max || 100;
      serie.max = config.funnelSort || 'descending';
      return serie;
    },

    _settingPieSerie: function(serie, config) {
      if (serie.type !== 'pie') {
        return serie;
      }

      serie.selectedMode = 'single';
      serie.selectedOffset = 10;
      serie.hoverOffset = 5;

      serie.radius = [0, '70%'];
      serie.labelLine = {
        normal: {
          show: true,
          length: 5,
          length2: 5
        }
      };
      serie.labelLine.normal.show = typeof config.labelLine ===
        'undefined' ? true : config.labelLine;
      if (typeof config.innerRadius === 'number') {
        if (config.innerRadius < 0) {
          config.innerRadius = 0;
        }
        if (config.innerRadius > 60) {
          config.innerRadius = 60;
        }
        serie.radius[0] = config.innerRadius + '%';
      }
      if (config.pieMode === 'rose') {
        serie.roseType = config.roseType || 'radius';
      }
      //absolute value for pie
      serie = this._absoluteValueForPieChart(serie);
      return serie;
    },

    _absoluteValueForPieChart: function(serie) {
      if (!serie || !serie.data || !serie.data[0]) {
        return serie;
      }
      serie.data = serie.data.map(function(item) {
        if (typeof item === 'number') {
          item = Math.abs(item);
        } else if (typeof item === 'object' && typeof item.value === 'number') {
          item.value = Math.abs(item.value);
        }
        return item;
      });
      return serie;
    },

    _settingRadar: function(option, config) {
      if (config.type !== 'radar') {
        return option;
      }
      option.radar = {
        nameGap: 6,
        radius: '70%'
      };
      option.radar.axisLabel = {
        show: true,
        formatter: function() {}
      };
      if (config.radarShape) {
        option.radar.shape = config.radarShape;
      }
      if (config.indicator) {
        this._handleRadarIndicator(config);
        option.radar.indicator = config.indicator;
      } else {
        console.error('No radar indicator');
      }

      return option;
    },

    _handleRadarIndicator: function(config) {
      var indicator = config.indicator;

      var data = config.series[0].data;
      var verticalValues = [];
      indicator.forEach(function(item, i) {
        if (typeof item.max !== 'undefined') {
          return item;
        }
        verticalValues = data.map(function(e) {
          var value = e.value;
          verticalValues.push(value[i]);
        });
        var max = Math.max.apply(Math, verticalValues);
        item.max = max;
      });
    },

    _settingStack: function(option, config) {
      if (!chartUtils.isAxisChart(config)) {
        return option;
      }
      config = this._stackForPercent(config);
      if (config.stack === 'percent') {
        var hasNegativeValue = config.series.some(function(serie) {
          return serie.data.some(function(item) {
            var value;
            if (item && item.value) {
              value = item.value;
            } else {
              value = item;
            }
            return typeof value === 'number' && value < 0;
          });
        });

        var allIsNegativeValue = config.series.every(function(serie) {
          return serie.data.every(function(item) {
            var value;
            if (item && item.value) {
              value = item.value;
            } else {
              value = item;
            }
            return typeof value === 'number' && value < 0;
          });
        });
        var min = 0;
        var max = 1;
        if (hasNegativeValue) {
          min = -1;
          if (allIsNegativeValue) {
            max = 0;
          }
          if (config.type === 'bar') {
            option.xAxis.max = max;
            option.xAxis.min = min;
          } else {
            option.yAxis.max = max;
            option.yAxis.min = min;
          }
        }
      }

      if (config.stack) {
        option.series = option.series.map(function(serie) {
          serie.stack = 'stack';
          return serie;
        });
      }
      return option;
    },

    _settingArea: function(option, config) {
      if (config.type !== 'line' || !config.area) {
        return option;
      }
      option.series = option.series.map(function(serie) {
        if (!serie.areaStyle) {
          serie.areaStyle = {};
        }
        if (typeof serie.areaStyle.opacity === 'undefined') {
          serie.areaStyle.opacity = 0.4;
        }
        serie.sthisoth = true;
        serie.smoothMonotone = 'x';
        return serie;
      });
      return option;
    },

    _stackForPercent: function(config) {
      if (config.stack !== 'percent') {
        return config;
      }
      var datas = [];
      config.series.forEach(function(serie) {
        var data = lang.clone(serie.data);
        data.forEach(function(e, i) {
          if (!datas[i]) {
            datas[i] = [];
          }
          var v;
          if (e && typeof e.value !== 'undefined') {
            v = e.value;
          } else {
            v = e;
          }
          if (!v) {
            v = 0;
          }
          datas[i].push(v);
        });
      });
      var sum = [];
      datas.forEach(function(data, i) {
        if (!sum[i]) {
          sum[i] = 0;
        }
        data.forEach(function(item) {
          sum[i] += Math.abs(item);
        });
      });

      var stackedData = datas.map(function(data, i) {
        return data.map(function(item) {
          if (sum[i] === 0) {
            return null;
          }
          if (item >= 0) {
            return Math.abs(item) / sum[i];
          } else {
            return -Math.abs(item) / sum[i];
          }

        });
      });

      config.series = config.series.map(function(serie, i) {
        var data = lang.clone(serie.data);
        data = data.map(function(d, index) {
          if (!d) {
            return d;
          }
          if (typeof d.value !== 'undefined') {
            d.value = stackedData[index][i];
          } else {
            d = stackedData[index][i];
          }
          return d;
        });
        serie.data = data;
        return serie;
      });
      return config;
    },
    _settingAxisDisplay: function(option, config) {
      if (!chartUtils.isAxisChart(config)) {
        return option;
      }
      option.xAxis.show = !config.hidexAxis;
      option.yAxis.show = !config.hideyAxis;
      option.grid.containLabel = !config.hideyAxis;

      return option;
    },

    _settingLegend: function(option, config) {
      if (!config.legend) {
        option.legend = {
          show: false
        };
        return option;
      }
      option.legend = {
        show: true,
        type: 'scroll',
        orient: 'horizontal',
        x: 'left',
        pageButtonPosition: 'end',
        pageTextStyle: {
          color: '#939393'
        },
        bottom: 20,
        y: 'bottom',
        data: []
      };

      if (chartUtils.isAxisChart(config) || config.type === 'gauge') {
        option.series.forEach(function(serie) {
          option.legend.data.push(serie.name);
        });
      } else if (config.type === 'pie' || config.type === 'funnel' ||
        config.type === 'radar') {
        option.series[0].data.forEach(function(item) {
          option.legend.data.push(item.name);
        });
      }
      option = this._handleLegendRTL(option, config);
      return option;
    },

    _handleLegendRTL: function(option, config) {
      if (!config.legend) {
        return option;
      }
      var legend = {};
      if (window.isRTL) {
        legend.x = 'right';
        legend.pageButtonPosition = 'start';
      } else {
        legend.x = 'left';
        legend.pageButtonPosition = 'end';
      }
      option.legend = lang.mixin(option.legend, legend);
      return option;
    },

    _settingScale: function(option, config) {
      if (!config.scale) {
        return option;
      }
      if (config.type === 'bar') {
        option.xAxis.scale = true;
      } else if (config.type === 'line' || config.type === 'column') {
        option.yAxis.scale = true;
      } else if (config.type === 'radar') {
        option.radar.scale = true;
      }
      return option;
    },

    _handleChartRtl: function(option, config) {
      if (!window.isRTL) {
        return option;
      }
      if (chartUtils.isAxisChart(config) || config.shape === 'vertical' || config.shape === 'horizontal') {
        option.xAxis.inverse = true;
        option.yAxis.position = 'right';
      }
      return option;
    },

    _pieChartAvoidLegendLabelOverLap: function(option, config) {
      if (config.type !== 'pie') {
        return option;
      }
      var radius = config.labelLine ? 0.75 : 0.85;
      if (config.legend) {
        radius -= 0.12;
      }
      option.series[0].radius[1] = radius * 100 + '%';
      return option;
    },

    settingDataZoom: function(option, config) {
      if (!chartUtils.isAxisChart(config)) {
        return option;
      }

      if (!config.series || config.series.length === 0) {
        return option;
      }

      if (config.dataZoom && config.dataZoom.length > 0) {
        var width = this.chart.getWidth();
        var oneColumnWidth = 10;
        var dataNumber = config.series[0].data.length;
        var seriesLength = config.series.length;
        var number = dataNumber * seriesLength;
        if (config.stack) {
          number = dataNumber;
        }
        if (seriesLength >= 5) {
          oneColumnWidth = 17;
        }

        var position = chartUtils.getAxisZeroPosition.call(this, config);
        if (config.type !== 'bar') {
          if (!window.isRTL) {
            var left = position.left;
            width = width - left - option.grid.right;
          } else {
            width = position.left;
          }
        } else {
          width = position.top;
        }

        this.showDataZoom = width / number < oneColumnWidth;
        var ratio = width / (number * oneColumnWidth);
        ratio = parseFloat(ratio * 100, 10).toFixed(3);
        ratio = ratio > 100 ? 100 : ratio;
        ratio = ratio === 0 ? 0.01 : ratio;
        var dataZoom = [];

        var axis = config.type === 'bar' ? 'xAxis' : 'yAxis';
        var axisIndex = config.type === 'bar' ? 'yAxisIndex' : 'xAxisIndex';
        var dzwh = config.type === 'bar' ? 'width' : 'height';

        option = this._initAxisOfDataZoom(option, axis);

        dataZoom = config.dataZoom.map(lang.hitch(this, function(item) {
          var zoomOption = {
            type: item,
            start: 0,
            show: this.showDataZoom
          };
          zoomOption[axisIndex] = [0];
          zoomOption[dzwh] = 15;
          zoomOption.end = ratio;
          if (axis === 'xAxis' && window.isRTL) {
            zoomOption.left = '10';
          }
          zoomOption = this._handleDataZoomPosition(config, zoomOption);
          return zoomOption;
        }));

        option.dataZoom = dataZoom;
      } else {
        this.showDataZoom = false;
        option.dataZoom = [];
      }

      return option;
    },

    _initAxisOfDataZoom: function(option, axis) {
      option[axis].type = 'value';
      option.xAxis.splitLine = {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      };
      option.yAxis.splitLine = {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      };
      return option;
    },

    _handleDataZoomPosition: function(config, zoomOption) {
      zoomOption.showDataShadow = false;
      zoomOption.realtime = false;
      if (config.legend) {
        zoomOption.bottom = 30;
      } else {
        zoomOption.bottom = 20;
      }
      if (config.type === 'bar' && config.legend) {
        zoomOption.bottom = 50;
      }
      return zoomOption;
    },

    _settingGrid: function(option, config) {
      if (!chartUtils.isAxisChart(config)) {
        return option;
      }
      //1.top
      var top = 10;

      if (option.grid) {
        option.grid.top = top;
      }
      //2.left right
      var lr_short = 10,
        lr_lang = 30,
        tb_short = 10,
        tb_lang = 43;
      if (config.hideyAxis) {
        tb_short = 20;
        tb_lang = 63;
      }
      //3.bottom
      var bottomAdd = 0;
      var barBottom = 10;
      if (config.legend) {
        bottomAdd = this.showDataZoom ? 10 : 20;
        barBottom += 20;
      }
      //4.special handle line chart
      if (config.type === 'line' && config.legend && !this.showDataZoom) {
        tb_short += 7;
      }
      //5.special handle bar chart
      if (config.type === 'bar') {
        if (window.isRTL) {
          option.grid.left = this.showDataZoom ? lr_lang : lr_short;
        } else {
          option.grid.right = this.showDataZoom ? lr_lang : lr_short;
        }
        //special handle
        if (config.hideyAxis && config.legend) {
          barBottom += 20;
        }
        option.grid.bottom = barBottom;
      } else {
        option.grid.bottom = this.showDataZoom ? tb_lang + bottomAdd : tb_short + bottomAdd;
      }
      return option;
    },

    _handleChartBorderWidthColor: function(option, config) {
      //borderWidth
      var borderWidth = 0;
      if (this._showBarBorderColor === 'single') {
        borderWidth = 0.1;
      } else if (this._showBarBorderColor === 'stack') {
        borderWidth = 1;
      }
      //border color
      var borderColor = 'transparent';
      var stackBorderColor = '';
      if (this._showBarBorderColor === 'stack') {
        stackBorderColor = '#fff';
        if (config.backgroundColor && config.backgroundColor !== 'transparent') {
          stackBorderColor = config.backgroundColor;
        }
      }
      option.series = option.series.map(function(serie) {
        if (serie.type === 'bar' || serie.type === 'pie') {
          if (!serie.itemStyle) {
            serie.itemStyle = {};
          }
          if (!serie.itemStyle.normal) {
            serie.itemStyle.normal = {};
          }
          if (!serie.itemStyle.emphasis) {
            serie.itemStyle.emphasis = {};
          }
          serie.itemStyle.normal.borderWidth = borderWidth;
          serie.itemStyle.emphasis.borderWidth = borderWidth;
          if (stackBorderColor) {
            serie.itemStyle.normal.borderColor = stackBorderColor;
            serie.itemStyle.emphasis.borderColor = stackBorderColor;
          } else {
            serie.itemStyle.normal.borderColor = borderColor;
            serie.itemStyle.emphasis.borderColor = borderColor;
          }
        }
        return serie;
      });
      return option;
    }
  });
});