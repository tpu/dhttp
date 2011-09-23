//var http = require('http');
//var url = require('url');
var fs = require('fs');
var ev = require('events').EventEmitter, events = new ev();
var vm = require('vm');


var evalWithObj = function( code, obj, err){
if(err){
  return vm.runInNewContext('var ret = ""; function $(d){ ret += d; }; '+
'(function(){ try{ '+code+'; return ret !== undefined ? ret : "";}'+
'catch(e){return e.toString()}})()',obj);
}

else{
  return vm.runInNewContext('var ret = ""; function $(d){ ret += d; }; '+
'(function(){ try{ '+code+'; return ret !== undefined ? ret : "";}'+
'catch(e){return ""}})()',obj);
}
}

exports.j2h = {
 codeExp : /(<\?)([\s\S]+?)(\?>)/im,
 //g_o     : {},
 html    : '',
 file    : '', 
 init    : function(src){ 
  this.file = fs.readFileSync(src); 
                        },
 run     : function(onErr, obj, callback){
           events.once( 'success', callback );
  try{
   this.html = this.file.toString();
    while(true){
     if(!this.codeExp.test(this.html)){ break; }
      this.html = this.html.replace(this.codeExp, evalWithObj(this.codeExp.exec(this.html)[2], obj, onErr));
    }
    events.emit('success', false, this.html );
  }catch(e){ events.emit( 'success', true, this.html ); }
 },

}

