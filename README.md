# Web App Builder Custom Widgets

Adrián Pérez Beneito Web App builder Custom Widget List
- [Bar Chart Cedar](https://github.com/AdriSolid/WAB-Custom-Widgets/blob/master/README.md#bar-chart-cedar-bar_chart-live-demo)
- [Intro.js](https://github.com/AdriSolid/WAB-Custom-Widgets/blob/master/README.md#introjs-ft-wab-dizzy-live-demo)
- [Heat Map](https://github.com/AdriSolid/WAB-Custom-Widgets/blob/master/README.md#heat-map-wab-27-fire-live-demo)
- [ChartJS](https://github.com/AdriSolid/WAB-Custom-Widgets#chartjs-widget-chart_with_upwards_trend-live-demo)
- [Buffer](https://github.com/AdriSolid/WAB-Custom-Widgets/blob/master/README.md#buffer-widget-red_circle-live-demo)
- [Select by Attributes](https://github.com/AdriSolid/WAB-Custom-Widgets/blob/master/README.md#select-by-attributes-widget-diamond_shape_with_a_dot_inside-live-demo)


## Bar Chart Cedar :bar_chart: [live demo](https://adrisolid.github.io/CedarWidget/)
See [Cedar.js](https://esri.github.io/cedar/tutorial/) and how to create charts using ArcGIS Geoservices. Pre-coded Web App Builder 2.6 Chart Widget doesn't allow you to create charts on the fly. You can select the available layers in the Web Map. Choose, for the 'x' axis, the field you want to show information, repeat the procedure for the 'y' axis. Select the type of graphic, bars or horizontal bars. The widget is ready to filter the data by extension (by activating the check button). Inside the container of the widget, the graphic will be updated being this responsive.

![.](http://adri2c.maps.arcgis.com/sharing/rest/content/items/25a901a69bc3449a9658ddd1386bb444/data)

Don't forget to add the [Cedar dependencies](https://github.com/esri/cedar#loading-cedar). [How to add other libraries to WAB?](https://developers.arcgis.com/web-appbuilder/sample-code/add-a-third-party-library.htm)

**Version 1.2**, pending improvements. All suggestions for improvement will be welcome.

**List of the latest enhancements and changes:**
- Added a new class => select the layers ids from the Web Map (Dojo Select) 
- Added geometry icon; geometry selector (now => "*")


***

## IntroJS ft WAB :dizzy: [live demo](https://adrisolid.github.io/IntroJS/)
### Why using [intro.js](https://introjs.com/)?
When new users visit your website or product you should demonstrate your product features using a step-by-step guide. Even when you develop and add a new feature to your product, you should be able to represent them to your users using a user-friendly solution. Intro.js is developed to enable web and mobile developers to create a step-by-step introduction easily.

![.](http://adri2c.maps.arcgis.com/sharing/rest/content/items/486a97c81a394212b4a059c80667f275/data)

### Integration with a Web App Builder app

**Add [intro.js dependencies](https://github.com/usablica/intro.js/#introjs-v290)** [How to add other libraries to WAB?](https://developers.arcgis.com/web-appbuilder/sample-code/add-a-third-party-library.htm)

**Create the configuration js file and refer to it in the application in the file 'index.html'**
Explore and get with the console the ids of the containers to which you want to add as a step. If the container doesn't have the 'id' property, get it with 'settingid' -element: getNode('[settingid="widgets_LayerList_Widget_19"]'), position: 'left'- (e.g. the header widgets). Fill the 'intro' and 'position' options:

```
function getNode(node){
    //Getting ids or classes cleanly
    return document.querySelector(node);
}

function initIntro(){
    introJs().setOptions({
        steps: [{
                intro: "Hello Web App Builder, I'm IntroJS, wanna join me? :)"
            },
            {
                element: getNode('#widgets_Search_Widget_3'),
                intro: "The Search widget enables end users to find locations or search features on the map.",
                position: 'bottom'
            }
            .
            .
            .
        ]
    }).start();
}
```
**Call the 'initIntro' function**
Simply add a button that calls the function. For example, go to the 'HeaderController' widget:

- Add the button at the container (Widget.html):

```
<div class="container-section jimu-float-leading" data-dojo-attach-point="containerNode">
    <button data-dojo-attach-point="executeIntroJS" type="button"></button>
</div>
```

- Add a new function for contain the button and call it at 'startup' (Widget.js):

```
startup: function() {
  this.inherited(arguments);
  this.resize();
  setTimeout(lang.hitch(this, this.resize), 100);
  this.IntroJS();
},

IntroJS: function(){
  new Button({
      label: "INTRO JS",
      style: "position:absolute;top:5px;left:400px;",
      onClick: () => {
        initIntro()
      }
  }, this.executeIntroJS).startup();
},

```


***


## Heat Map WAB 2.7 :fire: [live demo](https://adrisolid.github.io/heatMapWidget/)
### Using ArcGIS API for JavaScript 3.23 for create a Heat Map in WAB 2.7
The [HeatmapRenderer](https://developers.arcgis.com/javascript/3/jsapi/heatmaprenderer-amd.html) renders feature layer point data into a raster visualization that emphasizes areas of higher density or weighted values. This renderer uses a Gaussian Blur technique to average the influence of each point out over the area determined by the 'blurRadius' (the radius (in pixels) of the circle over which the majority of each point's value is spread out.). A Gaussian blur uses a Gaussian, or Normal, distribution (also called a Bell-curve) to spread value out in vertical and horizontal directions. 

### Using HeatMap Widget

- Select a layer (it needs point type; the widget is already prepared for filter the layers and get 'point' layers)
- Select a field (numeric -short, float, etc-)
- Slider: select 'Blur Radius' (The radius -in pixels- of the circle over which the majority of each point's value is spread out)
- Slider: select 'Max Value' (The pixel intensity value which is assigned the final color in the color ramp. Values above this number             will also be assigned the final color ramp color)
- Slider: select 'Min Value' (The pixel intensity value which is assigned the initial color in the color ramp. Values below this number           will also be assigned the initial color ramp color)
- Draw Tools: Generate the map by spatially delimiting the result using drawing tools
- [Heat Map Slider](https://developers.arcgis.com/javascript/3/jsapi/heatmapslider-amd.html): (A widget to assist in obtaining values for managing and setting properties on a HeatmapRenderer)
- Drawing Tools: Create a HeatMap using drawing tools as a spatial delimiter. Options => Polygon, Freehand Polygon, Circle, Ellipse, Rectangle

![.](http://adri2c.maps.arcgis.com/sharing/rest/content/items/a6490383b48e4491afb2b9650375cec8/data)


***


## ChartJS Widget :chart_with_upwards_trend: [live demo](https://adrisolid.github.io/ChartJSWidget/)
### Using [ChartJS](http://www.chartjs.org/) for create charts using your GeoServices
Chart.js is a community maintained [open-source library](https://github.com/chartjs/Chart.js) that helps you easily visualize data using JavaScript. ChartJS is simple and clean HTML5 based JavaScript charts. Display line and bar charts using your GeoServices.

### Integration with a Web App Builder app

**Add [ChartJS dependencies](http://www.chartjs.org/docs/latest/getting-started/installation.html)** [How to add other libraries to WAB?](https://developers.arcgis.com/web-appbuilder/sample-code/add-a-third-party-library.htm)

### Using Chart Widget

![.](http://adri2c.maps.arcgis.com/sharing/rest/content/items/2bb5dd73fdf24907839b6e8da6f29077/data)

- Select a layer 
- Select a field for 'x' axis
- Select a field for 'y' axis
- Click 'Execute' button
- Click on the tabs to switch the chart. Both graphics will be executed automatically. These will be filtered every time the map extension changes


***


## Buffer Widget :red_circle: [live demo](https://adrisolid.github.io/Buffer/)
### Using [Turf.js](http://turfjs.org/). Advanced geospatial analysis for browsers and Node.js
Turf is a JavaScript library for spatial analysis. It includes traditional spatial operations, helper functions for creating GeoJSON data, and data classification and statistics tools. Turf can be added to your website as a client-side plugin, or you can run Turf server-side with Node.js.

### Integration with a Web App Builder app

**Add [Turf.js dependencies](https://github.com/Turfjs/turf#installation)** [How to add other libraries to WAB?](https://developers.arcgis.com/web-appbuilder/sample-code/add-a-third-party-library.htm)

### Using Buffer Widget

![.](http://adri2c.maps.arcgis.com/sharing/rest/content/items/460bf3f0cc13454daf9f7b9b918cee25/data)

- Select the distance unit
- Pick on the map or input the coordinates
- Select the distance
- Intersection selection available. Select a layer and enable or disable the selection. Click the 'Execute' button



***


## Select by Attributes Widget :diamond_shape_with_a_dot_inside: [live demo](https://adrisolid.github.io/SelectByAttributesWidget/)

### Usage

This WAB widget copies part of the functionality of the famous 'Select by Attributes' of ArcMap.

'Select By Attributes allows you to provide a SQL query expression that is used to select features that match the selection criteria.' Follow Esri's instructions [here](http://desktop.arcgis.com/en/arcmap/10.3/map/working-with-layers/using-select-by-attributes.htm)

![.](http://adri2c.maps.arcgis.com/sharing/rest/content/items/f2cc4cf5830b48e3867eb2f06a7a724b/data)







                    
                    
                    
                    


