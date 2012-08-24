var fs = require('fs');
var ev = require('events').EventEmitter, events = new ev();
var vm = require('vm');


 var evalWithObj = function( code, obj, err){
  if( err ){
   return vm.runInNewContext('var ret = ""; function $(d){ ret += d; }; '+
    '(function(){ try{ '+code+'; return ret !== undefined ? ret : "";}'+
    'catch(e){return e.toString()}})()', obj );
 }
 else{
   return vm.runInNewContext('var ret = ""; function $(d){ ret += d; }; '+
    '(function(){ try{ '+code+'; return ret !== undefined ? ret : "";}'+
    'catch(e){return ""}})()', obj );
  }
 }

 exports.j2h = {
  codeExp : /(<\?)([\s\S]+?)(\?>)/im,
  html: '',
  init: function( src ){ 
  this.html = fs.readFileSync( src ).toString(); 
  },
  run: function(onErr, obj, callback){
   events.once( 'success', callback );
    try{
        while( true ){
          if( !this.codeExp.test( this.html ) ){ break; }
           this.html = this.html.replace( this.codeExp, evalWithObj( this.codeExp.exec( this.html)[2], obj, onErr ) );
        }
  events.emit( 'success', false, this.html );
   }catch( e ){ events.emit( 'success', 'Error in module j2h ['+e.toString()+']', this.html ); }
  },

 }