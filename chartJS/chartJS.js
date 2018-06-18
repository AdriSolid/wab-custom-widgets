define(['dojo/_base/declare',
        'dojo/_base/lang'], 
function(declare, lang){
  var clazz = declare(null, {

    chart: null,
   
    constructor: function(options){
      this.createChart(options.node, options.type, options.labels, options.label, options.data)
    },

    createChart: function(node, type, labels, label, data){
        this.chart = new Chart(node.getContext('2d'), { 
            type: type,
            data: { 
                labels: labels,
                datasets: [{  
                    label: label, 
                    fill: false,
                    backgroundColor: 'rgb(51, 173, 255)', 
                    borderColor: 'rgb(0, 138, 230)', 
                    borderWidth: 1,
                    pointRadius: 2,
                    data: data
                }] 
            }, 
            options: {}
        })
    },

    updateChart: function(labels, map){
        this.chart.data.labels = labels
        this.chart.data.datasets[0].data = map
        this.chart.update()
    }

  });
  return clazz;
});