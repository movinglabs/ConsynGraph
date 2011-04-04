/*
 * Raphael Based Graphing Library
 *
 *
 */

/* Convenience Methods for Arrays, inspired by  ico/grafico */
 
if(typeof Array.prototype.min == "undefined"){
  Array.prototype.min = function(){
    return Math.min.apply(Math, this); 
  }
}
if(typeof Array.prototype.max == "undefined"){
  Array.prototype.max = function(){
    return Math.max.apply(Math, this); 
  }
}
 

var ConsynGraph = (function(){
    var _graph = {};
    
    var extend = function(a,b){
      if(typeof b=="undefined") return;
      for(var i in b){
        a[i] = b[i]; 
      }
      return a;
    }
        
    var default_series_opts = {
      label:"",
      line: false,
      markers: true
      };
    
    var view_func = function ConsynGraph_View(series, opts){
      this.series = {};
      this.opts = {gutter: [10,20,10,20] };
      this.updateOptions(opts);
      this.updateData(series);
      this._objects = null;
      this.render_order = ['frame','title','background', 'grid','axes','series','legend'];
      
      
      this.viewport = {x:0,y:0, width: 200, height: 200};
      this.grapharea = {x:0,y:0, width: 200, height: 200};
      this.viewparameters = {x: {range:[0, 1]}, y: {range: [0,1]} };
      
      
    }
    
    var Renderer = function(e){
      extend(this, e);
    }
    extend(Renderer.prototype, {
      prepare:function(view, opts, context){
        return view;
      },
      render: function(view,opts, context){
        return view.paper.set();
      }
    });
    
    view_func.prototype = {
      draw: function(el,x,y,w,h){
        
        if(typeof x == "undefined") x=0;
        if(typeof y == "undefined") y=0;
        if(typeof w == "undefined") w=el.offsetWidth-x;
        if(typeof h == "undefined") h=el.offsetHeight-y;
        
        var gx = this.opts.gutter[0],
            gy = this.opts.gutter[3],
            gw = gx+this.opts.gutter[2],
            gh = gy+this.opts.gutter[1];
        
        this.viewport = {x:x,y:y,width:w,height:h};
        this.grapharea = {x:x+gx,y:y+gy,width:w-gw,height:h-gh};
        this._objects = {};
        this.paper = Raphael(el);
        this._draw();
      },
      toPixelCoord: function(coords){
        var xrange = this.viewparameters.x.range;
        var x = coords[0]-this.viewparameters.x.range[0];
        var xscale = this.grapharea.width / (xrange[1]-xrange[0]);
        x = x*xscale + this.grapharea.x;

        var yrange = this.viewparameters.y.range;
        var y = coords[1]-this.viewparameters.y.range[0];
        var yscale = this.grapharea.height / (yrange[1]-yrange[0]);
        y = this.grapharea.height - (y*yscale) + this.grapharea.y;
        
        /*
        alert(coords+ " -> " + [x,y] +  " | x.range: "+this.viewparameters.x.range+" x0: "+this.grapharea.x+ " xscale: "+xscale + " graphwidth: "+this.grapharea.width);
        */
        return [~~(x),~~(y)];
        
      },
      _draw: function(){
        var paper = this.paper;
        
        var k;
        
        for(var i in this.render_order){
          k = this.render_order[i];
          if(_graph.renderers[k])
            _graph.renderers[k].prepare(this, this.opts[k]);
        }

        for(var i in this.render_order){
          k = this.render_order[i];
          if(_graph.renderers[k])
            this._objects[k] = _graph.renderers[k].render(this, this.opts[k]);
        }
        
        
        // determine view parameters from the series that need to be displayed
        for(var i in this.series){
          
        }
        
        // alter view parameters based on axes settings
        
        
        // determine view to pixel parameters
          // title or not
          // padding
          // space required for axes
          // space required for legend
        
        // draw background
        
        // draw grid
        
        // draw axes
        
        // draw legend
        
        // draw each series
        
        
      },
      redraw: function(){
        this.paper.clear(); // TODO: check if this is correct
        this._draw();
      },
      setData: function(s){
        this.series = s;
      },
      updateData: function(s){
        this.series = extend(this.series, s);
        
        for(var i in this.series){
          if(typeof this.series[i].x == "undefined"
            && typeof this.series[i].y != "undefined"){
            // auto-generate x-values if only y-values are defined
            var x = [];
            for(var i=0; i<context.data.y.length; i++){
              x[j] = j+1;   
            }
            this.series[i].x = x;
          }
        }
        
      },
      updateOptions: function(opts){
        this.opts = extend(this.opts, opts);
      }
    };
    
    
    extend(_graph, {
      View: view_func,
      Renderer: Renderer,
      
      renderers:{
        frame: new Renderer({
          render: function(view,opts,context){
            var s = view.paper.set();
            var frame = view.paper.rect(view.viewport.x,view.viewport.y,
                                        view.viewport.width,view.viewport.height
                                     )
                                     .attr({fill:'#EEF',stroke:'#0F0'});
            s.push(frame);
            return s;
          }
        }),
        title: new Renderer({
            prepare: function(view,opts,context){
              // update view parameters to free space for a title
            },
            render: function(view,opts,context){ return view.paper.set();}
        }),
        series: new Renderer({
            prepare: function(view,opts,context){
              // update view parameters based on series data 
              
              var _min_x = Number.MAX_VALUE;
              var _max_x = Number.MIN_VALUE;
              var _min_y = Number.MAX_VALUE;
              var _max_y = Number.MIN_VALUE;
              var vs;
              for(var i in view.series){
                vs = view.series[i];
                
                _min_x = Math.min(_min_x, vs.x.min() );  
                _max_x = Math.max(_max_x, vs.x.max() );  
                _min_y = Math.min(_min_y, vs.y.min() );  
                _max_y = Math.max(_max_y, vs.y.max() );  
              }
              
              view.viewparameters = {x:{range: [_min_x, _max_x] }, y: {range: [_min_y, _max_y]} };
            },
            render: function(view,opts,context){
              var s = view.paper.set();
              
              for(var i in view.series){
                var sopt = view.opts.series[i];
                for(var j in sopt){
                  if(sopt[j]===false) continue;
                  s.push( _graph.renderers[j].render(view, sopt[j], {data:view.series[i]} ) );
                }
              }
              
              return s;
            }
        }),
        
        // serie specific renderers
        
        markers: new Renderer({
            
            render: function(view,opts,context){
              var s = view.paper.set();
              if(opts===true){
                opts = this.default
              }
              
//              alert(view.toPixelCoord([10,50]) );
              
              var d = context.data;
              for(var i=0; i<d.y.length; i++){
                var y = d.y[i],
                    x = d.x[i];
                    
                var p = view.toPixelCoord([x,y]);
                
                s.push( view.paper.circle(p[0], p[1], 5) );
              }

              return s;
            },default:{symbol: "o"}
        }),
        line: new Renderer({
            render: function(view,opts,context){
              if(opts===true){
                opts = this.default
              }
              
//              alert(view.toPixelCoord([10,50]) );
              
              var path = "";
              var d = context.data;
              var last = null;
              for(var i=0; i<d.y.length; i++){
                var y = d.y[i],
                    x = d.x[i];
                    
                var p = view.toPixelCoord([x,y]);
                if(last!==null){
                   path += "L"+p[0]+" "+p[1]; // straight line
                  
                  //path += "C"+(p[0]-15)+" "+p[1]+" "+(p[0]+15)+" "+p[1]+" "+p[0]+" "+p[1];
                }else{
                  path += "M"+p[0]+" "+p[1];
                }
                last=p;
                
              }
              return view.paper.path(path).attr({stroke:"#F00"});
              
            },
            default:{
              
            }
        }),
        area: new Renderer({
            
        }),
        label: new Renderer({
            
        }),
        
        
        
      }
    });
    
    return _graph;
      
    })();
