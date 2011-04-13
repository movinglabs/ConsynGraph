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
    
    var deepcopy = function deepcopy(obj) {
      // TODO: this is not really great, just good enough to clone option structures
      var out, i, len;
      if (typeof obj === 'object') {
        out = {};
        for (i in obj) {
          out[i] = deepcopy(obj[i]);
        }
        return out;
      }
      return obj;
    }
    
    var default_series_opts = {
      label:"",
      line: false,
      markers: true
      };
    
    var view_func = function ConsynGraph_View(series, opts){
      this.series = {};
      this.options = {gutter: [10,20,10,20] };
      this.updateOptions(opts);
      this.updateData(series);
      this._objects = null;
      
      this.prepare_order = ['frame','title','background','series','legend','grid','axes'];
      
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
        return opts;
      },
      render: function(view,opts, context){
        return view.paper.set();
      }});
    
    /* SeriesRenderer is a renderer specific to dataseries. It's methods are called by the series-renderer and legend-renderer */
    var SeriesRenderer = function(e){
      extend(this,e); 
    }
    extend(SeriesRenderer.prototype, Renderer.prototype);
    extend(SeriesRenderer.prototype, {
        renderLegend: function(x,y,w,h, view,opts,context){
          return view.paper.set(); 
       }
    });
    
    view_func.prototype = {
      draw: function(el,x,y,w,h){
        
        if(typeof x == "undefined") x=0;
        if(typeof y == "undefined") y=0;
        if(typeof w == "undefined") w=el.offsetWidth-x;
        if(typeof h == "undefined") h=el.offsetHeight-y;
        
        var gx = this.options.gutter[0],
            gy = this.options.gutter[3],
            gw = gx+this.options.gutter[2],
            gh = gy+this.options.gutter[1];
        
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
        
        var k, ret;
        
        for(var i in this.prepare_order){
          k = this.prepare_order[i];
          if(_graph.renderers[k]){
            ret = _graph.renderers[k].prepare(this, this.options[k]);
            if(typeof ret == "object") this.options[k] = ret; 
          }
        }

        for(var i in this.render_order){
          k = this.render_order[i];
          if(_graph.renderers[k] && this.options[k]!==false)
            this._objects[k] = _graph.renderers[k].render(this, this.options[k]);
        }
        
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
        this.options = extend(this.options, opts);
      }
    };
    
    
    extend(_graph, {
      View: view_func,
      Renderer: Renderer,
      
      renderers:{
        frame: new Renderer({
          render: function(view,opts,context){
            opts = extend({fill:'#EEE',stroke:'#DDD'},opts); 
            
            
            var s = view.paper.set();
            var frame = view.paper.rect(view.viewport.x,view.viewport.y,
                                        view.viewport.width,view.viewport.height
                                     )
                                     .attr(opts);
            s.push(frame);
            return s;
          }
        }),
        
        axes: new Renderer({
          prepare: function(view,opts,context){

            if(typeof opts.south =="object"){
              if(opts.south.from_zero) view.viewparameters.x.range[0] = Math.min(0,view.viewparameters.x.range[0]);
            }
            if(typeof opts.west =="object"){
              if(opts.west.from_zero) view.viewparameters.y.range[0] = Math.min(0,view.viewparameters.y.range[0]);                
            }
          },
          render: function(view,opts,context){
            
            var vp = view.grapharea;
            var s = view.paper.set();
            
            var y2 = vp.y + vp.height;  
            var x2 = vp.x + vp.width;
              
            if(opts.south){
              s.push ( this.renderAxis(vp.x, y2, x2, y2,[0,1], view, opts.south, context) );
            }
            
            if(opts.west){
              s.push ( this.renderAxis(vp.x, y2, vp.x, vp.y,[-1,0], view, opts.west, context) );
            }
            
            return s;
          },
          renderAxis: function(x1,y1, x2,y2,orient, view, opts, context ){
            
            var numticks = 10;
            var ticksize = 3;
            
            var dx = (x2-x1) / (numticks-1);
            var dy = (y2-y1) / (numticks-1);
            
            var tickspath = "M"+x1+" "+y1;
            
            var px=x1, py=y1;
            for(var i=0; i<numticks; i++){
              tickspath+= "M"+px+" "+py+"l"+(ticksize*orient[0])+" "+(ticksize*orient[1]);
              px+=dx;
              py+=dy;
            }
            
            return view.paper.path("M"+x1+" "+y1+"L"+x2+" "+y2 + tickspath );
            
          }
        }),
        background: new Renderer({
            render: function(view,opts,context){
              if(typeof opts != "object") opts = {fill:'#FFF','stroke-width': 0};
               var s = view.paper.set();
               var frame = view.paper.rect(view.grapharea.x,view.grapharea.y,
                                            view.grapharea.width,view.grapharea.height
                                         )
                                         .attr(opts);
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
        legend: new Renderer({
            prepare: function(view,opts,context){
              // update view parameters to free space for a title
            },
            render: function(view,opts,context){
              var num_series = 0;
              
              for(var i in view.series){
                num_series++; 
              }
              
              var set = view.paper.set();
              if(num_series>0){
                var dy = 20;
                var w = 200;
                var h = dy*num_series;
                var x = view.viewport.width - w - 10;
                var y = 10;
                var box = view.paper.rect(x, y, w, h)
                  .attr({fill:'#FFF','stroke-width':1,'stroke':'#DDD'});
                  set.push(box);
                  
                var xt = x+2;
                var yt = y+10;
                var ta, lab, sopts,col;
                for(var i in view.series){
                  lab = ""+i;
                  sopts = view.options.series[i];
                  if(typeof sopts != "undefined"){
                    for(var k in sopts){
                      if(typeof _graph.renderers[k] !="undefined"){
                        if(sopts[k]===false) continue;
                        set.push(
                          _graph.renderers[k].renderLegend(xt,yt,20,20, view,sopts[k],context)
                          );
                      }
                    }
                    
                    if( typeof sopts.label != "undefined"){
                      lab = sopts.label;
                    }
                  }
                  ta = view.paper.text(xt+22, yt, lab).attr({color:'#000','text-anchor':'start','font-size':10});
                  set.push(ta);
                  yt+=dy;
                }
              }
              return set;
            }
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
              
              
              for(var i in view.series){
                var sopt = view.options.series[i];
                for(var j in sopt){
                  if(sopt[j]===false) continue;
                  ret = _graph.renderers[j].prepare(view, sopt[j], {data:view.series[i]} );
                  if(typeof ret == "object") sopt[j] = ret; 
                }
              }
            },
            render: function(view,opts,context){
              var s = view.paper.set();
              
              for(var i in view.series){
                var sopt = view.options.series[i];
                for(var j in sopt){
                  if(sopt[j]===false) continue;
                  s.push( _graph.renderers[j].render(view, sopt[j], {data:view.series[i]} ) );
                }
              }
              
              return s;
            }
        }),
        
        // serie specific renderers
        
        markers: new SeriesRenderer({
            
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
            },
            renderLegend: function(x,y,w,h, view, opts, context){
              return view.paper.circle( ~~(x+(w/2)), y, ~~(w/4) );
              
            },
            default:{symbol: "o"}
        }),
        line: new SeriesRenderer({
            
            prepare: function(view,opts, context){
              if(opts===true){
                opts = deepcopy(this.default);
              }else opts = extend(deepcopy(this.default), opts);
              
              if(!opts.smooth)opts.smooth=0;
              if(typeof opts.stroke=="undefined"){
                opts.stroke = Raphael.getColor();
              }
              return opts;
            },
            render: function(view,opts,context){
              
              var smooth=opts.smooth/2;

              
              
              var path = "";
              var d = context.data;
              var pc = [];
              for(var i=0; i<d.y.length; i++){
                var y = d.y[i],
                    x = d.x[i];
                    
                pc[i] = view.toPixelCoord([x,y]);
                
              }
              var p,last,_x1,_y1;
              for(var i=0; i<pc.length; i++){
                p = pc[i], last=pc[i-1];
                if(i>0){
                   var x1 = last[0];
                   var y1 = last[1];
                   var x2 = p[0];
                   
                   var y2 = p[1];
                   
                   if(i>1){
                     x1 = last[0]+_x1;
                     y1 = last[1]+_y1;
                   
                   }
                   if(i<pc.length-1){
                     var dx = pc[i+1][0]-last[0];
                     var dy = pc[i+1][1]-last[1];
                     
                     var f = (p[0]-last[0])/dx;
                     
                     _x1 = (dx*(1-f))*smooth; 
                     _y1 = (dy*(1-f))*smooth;
                   
                     x2 = p[0]-(dx*f)*smooth;
                     y2 = p[1]-(dy*f)*smooth;
                     
                   }
                   
                   
                   //path += "L"+p[0]+" "+p[1]; // straight line
         /* bezier debugging code *
                   view.paper.path("M"+last[0]+" "+last[1]+"L"+x1+" "+y1).attr({'stroke-dasharray':'- ',stroke:'#CCC'});
                   view.paper.circle(x1,y1,2).attr({fill:'#0F0'});
                   view.paper.path("M"+p[0]+" "+p[1]+"L"+x2+" "+y2).attr({'stroke-dasharray':'- ',stroke:'#CCC'});
                   view.paper.circle(x2,y2,2).attr({fill:'#00F'});
                   */
                   path += "C"
                        +  x1+" "+y1
                        +  " "+x2+" "+y2
                        +  " "+p[0]+" "+p[1];
                }else{
                  path += "M"+p[0]+" "+p[1];
                }
                
              }
              return view.paper.path(path).attr({stroke:opts.stroke});
              
            },
            renderLegend: function(x,y,w,h, view, opts, context){
              var col = opts.stroke;
              return view.paper.path("M"+x+" "+y+"l"+w+" 0").attr({stroke:col,'stroke-width':2});
              
            },
            
            default:{
              smooth: 0.5
            }
        }),
        area: new SeriesRenderer({
            
        }),
        label: new SeriesRenderer({
            
        }),
        
        
        
      }
    });
    
    return _graph;
      
    })();
