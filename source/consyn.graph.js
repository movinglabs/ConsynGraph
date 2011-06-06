/*
 * ConsynGraph - A Raphael Based Graphing Library
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
    
    var colors = [];
    for(var i=0; i<10; i++){
      colors[i] = Raphael.getColor();
      Raphael.getColor(); // skip one color, for better difference
    }
    
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
      
      this.colors = colors;
      
      this.prepare_order = ['frame','title','background','stack','series','legend','grid','axes'];
      
      this.render_order = ['frame','title','background', 'grid','axes','series','legend', 'dynlabels'];
      
      
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
        
        var gx = this.options.gutter[3],
            gy = this.options.gutter[0],
            gw = gx+this.options.gutter[1],
            gh = gy+this.options.gutter[2];
        
        this.viewport = {x:x,y:y,width:w,height:h};
        this.grapharea = {x:x+gx,y:y+gy,width:w-gw,height:h-gh};
        this._objects = {};
        this._parent_element = el;
        this.paper = Raphael(el);
        this._draw();
      },
      fromPixelCoord: function(pxcoords){
        var xrange = this.viewparameters.x.range;
        var xscale = this.grapharea.width / (xrange[1]-xrange[0]);
        
        var x = (pxcoords[0]-this.grapharea.x)/xscale;
        x += this.viewparameters.x.range[0];

        var yrange = this.viewparameters.y.range;
        var yscale = this.grapharea.height / (yrange[1]-yrange[0]);
        
        var y = (pxcoords[1]-this.grapharea.y)/yscale;
        y += this.viewparameters.y.range[0];

        
        return [x,y];
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
      formatNumber: function(n, size){
        if(typeof size=="undefined") size=5;
        var s = ""+n;
        if(s.length > size){
          var off = s.indexOf(".");
          if(off<size){
            s = s.substring(0,size); 
          }else{
            s = s.substring(0,off); 
          }
        }
        return s;
      },
      toPathString: function(d, opts,reverse){
        smooth=opts.smooth/2;

        
        
        var path="";
        var pc = [];
        var reverse = typeof reverse != "undefined" && reverse;
        for(var i=0; i<d.y_real.length; i++){
          var y = d.y_real[i], x = d.x[i];
          
          ix = i; if(reverse) ix = d.y_real.length-i-1;
          pc[ix] = this.toPixelCoord([x,y]);
          
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
             if(opts.step){
               path += "L"+p[0]+" "+last[1]+((opts.step=="continuous")?"L":"M")+p[0]+" "+p[1];
             }else{
               path += "C"
                    +  x1+" "+y1
                    +  " "+x2+" "+y2
                    +  " "+p[0]+" "+p[1];
             }
          }else{
            path += "M"+p[0]+" "+p[1];
          }
        }
        return path;
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
      Func: {
        timestampLabels: function(v, i, min, max){
          // TODO: how to make sure all ticks are distinct?
          // TODO: prevent showing redundant info
          var d = new Date(v*1000);
          var len = max-min;
          var date = d.getDate();
          var m = d.getMinutes();
          if(m<10)m = "0"+m;
          if(len < 48*3600){
            return d.getHours()+":"+m;            
          }else if(len < 15*24*3600){
            return date+(date==1?'st':(date==2?'nd':(date==3?'rd':'th')))+" "+d.getHours()+":"+m;
          }else if(len < 60*24*3600){
            return d.getDate();
          }else{
            return d.toDateString();
          }
        }
      },
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
              var dy = 30;
              view.grapharea.height-=dy;
            }
            if(typeof opts.west =="object"){
              if(opts.west.from_zero) view.viewparameters.y.range[0] = Math.min(0,view.viewparameters.y.range[0]);
              var dx = 50;
              view.grapharea.x+=dx;
              view.grapharea.width-=dx;
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
            var set = view.paper.set();
            var numticks = 10;
            var ticksize = 3;
            var textspace = 10;
            
            var dx = (x2-x1) / (numticks-1);
            var dy = (y2-y1) / (numticks-1);
            
            var datarange = view.viewparameters.y.range;
            if(orient[0]==0)datarange = view.viewparameters.x.range;
            
            
            var textanchor='middle';
            if(orient[0]==-1)textanchor='end';
            else if(orient[0]==1)textanchor='start';
            
            var ddata = (datarange[1]-datarange[0]) / (numticks-1);
            
            var tickspath = "M"+x1+" "+y1;
            
            var labfun = this.formatLabel;
            if(typeof opts.label=="function"){
              labfun = opts.label;
            }
              
            var pdata=datarange[0], px=x1, py=y1, lab="",prevlab="";
            for(var i=0; i<numticks; i++){
              tickspath+= "M"+(~~px)+" "+(~~py)+"l"+(~~(ticksize*orient[0]))+" "+(~~(ticksize*orient[1]));
              lab = pdata;
              
              lab = labfun(lab, i, datarange[0], datarange[1]);
              if(lab!==prevlab){
                set.push ( 
                   view.paper.text(px+(textspace*orient[0]), py+(textspace*orient[1]), lab )
                   .attr({'font-size':8,'text-anchor':textanchor}) 
                      );
              }
              prevlab=lab;
              
              px+=dx;
              py+=dy;
              pdata+=ddata;
              
            }
            
            set.push( view.paper.path("M"+x1+" "+y1+"L"+x2+" "+y2 + tickspath ) );
            
            if(opts.name){
              set.push( 
                view.paper.text(
                 x1 + ~~((x2-x1)/2 + orient[0]*50),
                 y1 + ~~((y2-y1)/2 + orient[1]*25),
                 opts.name).attr({'font-size': 11, rotation: orient[0]?-90:0})
                 );
            }
            
            return set;
          },
          formatLabel: function(v, i, min, max){
            if(typeof v=="number"){
               return ~~(v*100)/100;
            }
            return v; 
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
              // update view parameters to free space for a legend
              
              view.grapharea.width-=150;
            },
            render: function(view,opts,context){
              var num_series = 0;
              
              for(var i in view.series){
                num_series++; 
              }
              
              var set = view.paper.set();
              if(num_series>0){
                var dy = 20;
                var w = 150;
                var h = dy*num_series;
                var x = view.viewport.width - w - 5;
                var y = view.options.gutter[0];
                var box = view.paper.rect(x, y, w, h)
                  .attr({fill:'#FFF','stroke-width':1,'stroke':'#DDD'});
                  set.push(box);
                  
                var xt = x+2;
                var yt = y+10;
                var ta, lab, sopts,col;
                var c=0;
                for(var i in view.series){
                  lab = ""+i;
                  sopts = view.options.series[i];
                  if(typeof sopts != "undefined"){
                    for(var k in sopts){
                      if(typeof _graph.renderers[k] !="undefined"){
                        if(sopts[k]===false) continue;
                        set.push(
                          _graph.renderers[k].renderLegend(xt,yt,20,20, view,sopts[k], {color: view.colors[c%view.colors.length]})
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
                  c++;                  
                }
              }
              return set;
            }
        }),
        dynlabels: new Renderer({
          render: function(view,opts,context){
            
            var vp = view.grapharea;
            
            var y2 = vp.y + vp.height;  
            var x2 = vp.x + vp.width;
            
            var rect = view.paper.rect(vp.x, 0, vp.width, view.viewport.height).attr({fill:'#000','opacity':0,'stroke-width':0});
            
            
            var ruler = view.paper.rect(vp.x, vp.y, 2, vp.height).attr({fill:'#00C',opacity:0.2,'stroke-width':0});
            
            //var xlabel = view.paper.text(vp.x,y2,"").attr({'stroke':'#00C'});
            
            var serielabels ={};
            var serielabeltext = {};
            var LAB_WIDTH=30, LAB_HEIGHT=12;
            
            for(var i in view.series){
                var vs = view.series[i];
                serielabels[i] = view.paper.rect(0,0,LAB_WIDTH,LAB_HEIGHT).attr({fill:'#000',opacity: 0.8});                serielabeltext[i]=view.paper.text(0,0,"").attr({'font-size':10,stroke:'#FFF'})
                 
                serielabels[i].attr({x:vp.x,y:vp.y});
                serielabeltext[i].attr({x:vp.x+15,y:vp.y+6});
            }
            
            var _showlabels = function(x,y){
              
              ruler.attr({x:x});
              
              var coord = view.fromPixelCoord([x,y]);
              var cx = coord[0];
              //xlabel.attr({x:x, text: (Math.round(cx*10)/10)});
              
              var cps = [];
              
              for(var i in view.series){
                var vs = view.series[i];
                var closest = 0;
                var closest_dist = Number.MAX_VALUE;
                for(var ix=0; ix<vs.x.length; ix++){
                  var d = Math.abs(vs.x[ix]-cx);
                  if(d<closest_dist){
                    closest_dist = d; 
                    closest = ix; 
                  }
                }
                
                cps[cps.length] = [vs.x[closest], vs.y_real[closest], i, vs.y[closest] ];
              }
              
              cps.sort(function(a,b){
                  return b[1]-a[1]; 
              });
              
              var lastx = 0, lasty=0;
              for(var ix=0; ix<cps.length;ix++){
                var cp = cps[ix];
                var i = cp[2];
                var ylab = cp[3];
                var labcoord = view.toPixelCoord(cp);
                
                var x =labcoord[0];
                var y =labcoord[1];
                
                if(  (x+LAB_WIDTH  > lastx && x < lastx+LAB_WIDTH)
                  && (y+LAB_HEIGHT > lasty && y < lasty+LAB_HEIGHT)){ // actual overlap
                  if(x<=lastx){ // flip the label to the left
                    x-=LAB_WIDTH;
                  }else{ 
                    y-=LAB_HEIGHT;
                  }
                  
                }
                
                lastx = x;
                lasty = y;
                
                serielabels[i].attr({x:x, y:y,text:ylab});
                serielabeltext[i].attr({x:x+(LAB_WIDTH/2), y:y+(LAB_HEIGHT/2),text: view.formatNumber(ylab,5)});
                
              }
              
            };
            
            _showlabels(vp.x+vp.width,0);
            
            rect.mousemove(function(e){
             
              var scrollY = document.documentElement.scrollTop || document.body.scrollTop,
                scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
              var x = e.clientX + scrollX;
              var y = e.clientY + scrollY;
            
              var pe = view._parent_element;
              var finger = pe;
              var ox = 0, oy=0;
              do{ 
                ox += finger.offsetLeft;
                oy += finger.offsetTop;
                if(finger==document.body) break;
                finger = finger.offsetParent;
              }while(finger);
              
              ox+=view.viewport.x;
              oy+=view.viewport.y;
              
          //    ox+=vp.x;
          //    oy+=vp.y;
              
              x-=ox;
              y-=oy;
              
              _showlabels(x,y);
              
            });
            
            return rect;
            
          }
            
        }),
        stack: new Renderer({
            prepare: function(view,opts,context){
              // set y_offset and y_real  to build a stacked graph 
              if(!opts) return false;
              var vs;
              
              if(opts==true){
                console.log("yeah");
                opts = [];
                for(var i in view.series){
                  opts.push(i);
                }
                console.log(opts);
              }
              
              var last_y_offset=null;
              var last_x_offset=null;
              for(var k=0; k<opts.length; k++){
                var i = opts[k];
                vs = view.series[i];
                vs.y_offset = last_y_offset;
                vs.x_offset = last_x_offset;
                vs.y_real = [];
                for(var ix=0; ix<vs.y.length; ix++){
                  var off = 0;
                  if(vs.y_offset!==null && typeof vs.y_offset!="undefined"){
                    var x = vs.x[ix];
                    // find neighbour x values
                    for(var jx=0; jx<vs.y_offset.length; jx++){
                      
                      if(vs.x_offset[jx]>=x) break;
                    }
                    if(jx>=vs.y_offset.length)jx=vs.y_offset.length-1;
                    off=vs.y_offset[jx];
                    
                  }
                  vs.y_real[ix] = off+vs.y[ix];
                }
                last_y_offset = vs.y_real;
                last_x_offset = vs.x;
                
              }
              
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
                if(typeof vs.y_real == "undefined"){
                  view.series[i].y_real = vs.y;
                  vs = view.series[i];
                }
                _min_x = Math.min(_min_x, vs.x.min() );  
                _max_x = Math.max(_max_x, vs.x.max() );  
                _min_y = Math.min(_min_y, vs.y_real.min() );  
                _max_y = Math.max(_max_y, vs.y_real.max() );  
                
              }
              
              if(_max_x-_min_x<0.001){
                _min_x-=0.0001;
                _max_x+=0.0001; 
              }
              
              if(_max_y-_min_y<0.001){
                _max_y+=0.0001; 
              }
              
              view.viewparameters = {x:{range: [_min_x, _max_x] }, y: {range: [_min_y, _max_y]} };
              console.log(view.viewparameters);
              var c = 0;
              for(var i in view.series){
                var sopt = view.options.series[i];
                for(var j in sopt){
                  if(sopt[j]===false) continue;
                  ret = _graph.renderers[j].prepare(view, sopt[j], {data:view.series[i], color: view.colors[c%view.colors.length]} );
                  if(typeof ret == "object") sopt[j] = ret; 
                }
                c++;
              }
            },
            render: function(view,opts,context){
              var s = view.paper.set();
              var c=0;
              for(var i in view.series){
                var sopt = view.options.series[i];
                for(var j in sopt){
                  if(sopt[j]===false) continue;
                  s.push( _graph.renderers[j].render(view, sopt[j], {data:view.series[i], color: view.colors[c%view.colors.length]} ) );
                }
                c++;
              }
              
              return s;
            }
        }),
        
        // serie specific renderers
        
        markers: new SeriesRenderer({
            
            render: function(view,opts,context){
              var s = view.paper.set();
              opts = this.fixOpts(opts);
              
//              alert(view.toPixelCoord([10,50]) );
              
              var d = context.data;
              for(var i=0; i<d.y.length; i++){
                var y = d.y_real[i],
                    x = d.x[i];
                    
                var p = view.toPixelCoord([x,y]);
                
                var m = this.renderMarker(p[0], p[1], opts.size, view, opts, context);
                
                s.push(m);
              }

              return s;
            },
            renderLegend: function(x,y,w,h, view, opts, context){
              opts = this.fixOpts(opts);
              return this.renderMarker( ~~(x+(w/2)), y, Math.min(opts.size,
               ~~(w/4)), view, opts, context);
              
            },
            renderMarker: function(x, y, size, view, opts, context){
              var m = this.symbols[opts.symbol](view.paper, x, y, size, opts.attr);
              if(typeof opts.attr == "undefined"){
                opts.attr = {}; 
              }
              if(opts.attr.fill===true){
                opts.attr.fill=context.color; 
              }
              if((typeof opts.attr.stroke == "undefined") || opts.attr.stroke===true){
                opts.attr.stroke=context.color;
              }  
              m.attr(opts.attr); 
              return m;
            },
            fixOpts: function(opts){
              if(typeof opts == "undefined" || opts===true){
                opts =  deepcopy(this.default)
              }
              if(""+opts === opts) opts = extend(deepcopy(this.default),{symbol:opts});
              return opts;
            },
            default:{symbol: "o", size: 5},
            symbols:{
              "o": function(paper,x,y,s){
                return paper.circle(x,y,s);
              },
              "circle": function(paper,x,y,s){
                return paper.circle(x,y,s);
              },
              
              
            }
        }),
        line: new SeriesRenderer({
            
            prepare: function(view,opts, context){
              if(opts===true){
                opts = deepcopy(this.default);
              }else opts = extend(deepcopy(this.default), opts);
              
              if(!opts.smooth)opts.smooth=0;
              if(typeof opts.stroke=="undefined" && context.color){
                opts.stroke = context.color;
              }
              return opts;
            },
            render: function(view,opts,context){
              

              
              
              var d = context.data;
              var path = view.toPathString(d, opts);
                
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
            prepare: function(view,opts, context){
              if(opts===true){
                opts = deepcopy(this.default);
              }else opts = extend(deepcopy(this.default), opts);
              
              if(!opts.smooth)opts.smooth=0;
              if(typeof opts.fill=="undefined" && context.color){
                opts.fill = context.color;
              }
              return opts;
            },
            render: function(view,opts,context){
              

              
              
              var d = context.data;
              var path = view.toPathString(d, opts);
              
              var y0 = view.grapharea.y+view.grapharea.height;
              
              
              if(d.y_offset){
                var doffset={x: d.x_offset, y: d.y_offset,y_real: d.y_offset};
                var p1 = view.toPixelCoord([d.x[0], d.y_real[0]]);
                var p2 = view.toPixelCoord([d.x_offset[d.x_offset.length-1], d.y_offset[d.y_offset.length-1]]);
                path += "L"+p2[0]+" "+p2[1];
                path += view.toPathString(doffset, opts, true);
                path += "L"+p1[0]+" "+p1[1];
              }else{
                var p1 = view.toPixelCoord([d.x[0], 0]);
                var p2 = view.toPixelCoord([d.x[d.x.length-1], 0]);
                path += "L"+p2[0]+" "+y0+"L"+p1[0]+" "+y0;
              }
              return view.paper.path(path).attr({fill:opts.fill,opacity:opts.opacity, 'stroke-width':0});
              
            },
            renderLegend: function(x,y,w,h, view, opts, context){
              var col = opts.fill;
              var path = "M"+x+" "+y+"l"+w+" 0l0 "+~~(h/2)+"l"+(-w)+" 0";
              return view.paper.path(path).attr({fill:col,opacity:opts.opacity,'stroke-width':0});
              
            },
            
            default:{
              smooth: 0.5, opacity: 1.0
            }
        }),
            
        label: new SeriesRenderer({
            
        }),
        
        
        
      }
    });
    
    return _graph;
      
    })();
