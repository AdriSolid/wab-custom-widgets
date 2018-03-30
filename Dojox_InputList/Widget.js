define(['dojo/_base/declare', 
        'jimu/BaseWidget',
        'dojo/dom',
        'dojox/form/ListInput',
        'xstyle/css!https://dojotoolkit.org/scripts/dojo/dojox/form/resources/ListInput.css',
        'dojo/domReady!'],
function(declare, BaseWidget, dom, ListInput) {

  return declare([BaseWidget], {

    /*postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },*/

    startup: function() {
      this.inherited(arguments);
      this.initInputList();
    },

    initInputList: function(){
      new ListInput({
          name: 'Dynamic',
          value: "Hello!, it's Dojox!, :)"
        }, this.listNode);
    }

    /*onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }*/
  });
});