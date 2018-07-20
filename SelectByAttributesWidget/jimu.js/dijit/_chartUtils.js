define([
  'jimu/utils',
  'esri/lang'
], function(jimuUtils, esriLang) {
  return {

    tryLocaleNumber: function(value) {
      var result = value;
      if (esriLang.isDefined(value) && isFinite(value)) {
        try {
          var a = jimuUtils.localizeNumber(value);

          if (typeof a === "string") {
            result = a;
          }
        } catch (e) {
          console.error(e);
        }
      }
      //make sure the retun value is string
      result += "";
      return result;
    },

    isAxisChart: function(config) {
      return config.type === 'column' || config.type === 'bar' || config.type === 'line';
    },

    getAxisZeroPosition: function(config) {
      if (!this.chart) {
        return false;
      }
      var position = {};
      var xMin = 0,
        yMin = 0;
      if (jimuUtils.isNotEmptyObject(config.dataZoom, true) || config.scale) {
        if (config.series && config.series[0] && config.series[0].data) {
          var data = config.series[0].data;
          if (jimuUtils.isNotEmptyObject(data, true)) {
            if (config.type !== 'bar') {
              yMin = jimuUtils.getMinOfArray(data);
            } else {
              xMin = jimuUtils.getMinOfArray(data);
            }
          }
        }
      }
      var offPosition = this.chart.convertToPixel({
        xAxisIndex: 0,
        yAxisIndex: 0
      }, [xMin, yMin]);

      if (offPosition) {
        var left = offPosition[0] - 5;
        var top = offPosition[1] - 5;
        position.left = left;
        position.top = top;
      }

      return jimuUtils.isNotEmptyObject(position) ? position : false;
    },

    _getDisplayValue: function(value, percent) {
      var numberedValue = Number(value);
      if (typeof numberedValue === 'number') {
        if (percent) {
          value = jimuUtils.convertNumberToPercentage(value);
        } else {
          value = this.tryLocaleNumber(value);
        }
      }
      return value;
    },

    generateToolTip: function(toolInfo, value, reverse, percent, indicator) {
      var tootip = '';
      if (reverse) {
        tootip = '<div class="tooltip-tr reverse">';
      } else {
        tootip = '<div class="tooltip-tr">';
      }

      var colorEl = '<div class="colorEl marginRight5" style="background-color:' +
        jimuUtils.encodeHTML(toolInfo.color) + '"></div>';

      tootip += colorEl;

      var leftName = '';
      if (toolInfo.seriesType !== 'radar' && this._isVaildValue(toolInfo.seriesName)) {
        leftName = toolInfo.seriesName;
      } else if (this._isVaildValue(indicator)) {
        leftName = indicator;
      }
      if (leftName === '') {
        tootip += '<div>' + leftName + '</div>';
      } else {
        tootip += '<div>' + leftName + '</div>' + '<div>' + ' : ' + '</div>';
      }
      var callbackValue = 'null';
      if (this._isNotZeroBoolean(value)) {
        callbackValue = value;
      } else if (this._isVaildValue(toolInfo.value)) {
        callbackValue = toolInfo.value;
      }

      tootip += '<div>' + this._getDisplayValue(callbackValue, percent) + '</div>';

      if (toolInfo.seriesType === 'pie') {
        var percentageValue = toolInfo.percent;
        if (this._isVaildValue(percentageValue)) {
          percentageValue = percentageValue / 100;
        } else {
          percentageValue = 0;
        }
        tootip += '<div class="space-left">' + '(' + jimuUtils.convertNumberToPercentage(percentageValue) +
          ')' + '</div>';
      }
      tootip += '</div>';
      return tootip;
    },

    handleToolTip: function(params, value, reverse, percent, indicator) {
      var tootip = '<div class="tooltip-div">';
      if (!Array.isArray(params)) {
        params = [params];
      }

      if (this._isVaildValue(params[0].name)) {
        tootip += '<div class="tr">' + params[0].name + '</div>';
      }
      params.forEach(function(param) {
        if (param.seriesType !== 'radar') {
          tootip += this.generateToolTip(param, value, reverse, percent, indicator);
        } else {
          tootip += this._handleRadarTooltip(param, reverse, percent, indicator);
        }
      }.bind(this));

      tootip += '</div>';

      return tootip;
    },

    _handleRadarTooltip: function(param, reverse, percent, indicator) {
      var tootip = '';
      var radarValue = param.value || [];
      radarValue.forEach(function(val, i) {
        tootip += this.generateToolTip(param, val, reverse, percent, indicator[i]);
      }.bind(this));
      return tootip;
    },

    _isVaildValue: function(value) {
      if (encodeURI(value) === "%00-") {
        return false;
      } else {
        return this._isNotZeroBoolean(value);
      }

    },

    _isNotZeroBoolean: function(value) {
      if (value === 0) {
        return true;
      }
      return !!value;
    }

  };
});