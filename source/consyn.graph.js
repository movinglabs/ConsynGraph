/*
 * Raphael Based Graphing Library
 *
 *
 */
 

var ConsynGraph = (function(){
    var extend = function(a,b){
      for(var i in b){
        a[i] = b[i]; 
      }
    }
        
    var view_func = function ConsynGraph_View(series, opts){
      this.series = series || {};
      this.opts = extend({
        
      }, opts);
    }
    view_func.prototype = {
      add: function(s){
        this.series.push(s);
      },
      draw: function(el){
        this.paper = Raphael(el);
      },
      redraw: function(){
        alert("TODO: implement"); 
      }
      
      
    };
    
    var serie_func = function ConsynGraph_Serie(data, opts){
      this.data = data || [];
      this.opts = extend({
          
      }, opts);
    }
    serie_func.prototype = {
      draw: function(){
        
      }
    };
    
    
    return {
      View: view_func,
      ViewGrid: viewgrid_func,
      Serie: serie_func,
      
      
    };
})();
