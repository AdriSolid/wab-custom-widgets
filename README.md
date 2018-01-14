# Web App Builder Custom Widgets


## Bar Chart Cedar :bar_chart: [live demo](https://adrisolid.github.io/CedarWidget/)
See [Cedar.js](https://esri.github.io/cedar/tutorial/) and how to create charts using ArcGIS Geoservices. Pre-coded Web App Builder 2.6 Chart Widget doesn't allow you to create charts on the fly. You can select the available layers in the Web Map. Choose, for the 'x' axis, the field you want to show information, repeat the procedure for the 'y' axis. Select the type of graphic, bars or horizontal bars. The widget is ready to filter the data by extension (by activating the check button). Inside the container of the widget, the graphic will be updated being this responsive.

Don't forget to add the Cedar dependencies. [How to add other libraries to WAB?](https://developers.arcgis.com/web-appbuilder/sample-code/add-a-third-party-library.htm)

I added the following dependencies in the 'index.html' file of the app:
```
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/vega/2.6.1/vega.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/arcgis-cedar@0.9.1/dist/cedar.min.js"></script>
```
Version 1.1, pending improvements. All suggestions for improvement will be welcome.

List of the latest enhancements and changes:
- Added a new class => select the layers ids from the Web Map (Dojo Select)

