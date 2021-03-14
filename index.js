var __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
var cur_graph_id;
var cur_graph_title="Default Graph";
// console.log(location.hostname);
var hide_links = 0;
var hide_edges = 0;
var hide_edges_order = 0;
var hide_edges_section = 0;
var vizz, cur_tool, viz_selected, thisGraph, thisForce, thisLinkAdd, thisLinkDrag, dragProcessor;
var edgelabels;
var edgepaths;
var width = 1310;
var height = 760;
var circle, text, link;
var stroke_width =  '1px';
// var pulsing;
var selected2edit;
var dbdata;
var mode_edit = false;
mode_edit = true;

var is_picker = false
var stub_json =  {"last_index": 3,
	"nodes": [
	{
		"fixed": 0,
		"x": 0,
		"y": 0,
		"level": 2,
		"color": "red",
		"index": 0,
		"weight": 4,
		"id": 1,
		"title_ru": "Привет!"
	},
	{
		"fixed": 0,
		"x": 0,
		"y": 0,
		"level": 2,
		"color": "green",
		"index": 0,
		"weight": 4,
		"id": 2,
		"title_ru": "Пока!"
	}
	],
	"links": [ {
		"source": 1,
		"target": 2		
}] };

function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

function set_title(s) {
	document.title = s;
	cur_graph_title = s;
	d3.select('#cgraph_name').attr("value", s);
}

function set_id(d) {
	cur_graph_id = d;
	d3.select('#gnum').html(" [" + d +  "]");
}

function scale2lvl (lvl) {
	lvl = +lvl--;
	return [50, 40, 25, 15, 7, 5][lvl]; // 0 is not used
}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 0.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}



function gogo(krug){ // har
    repeat();
    function repeat() {
    krug.attr("fill", "yellow")
		.transition()
		.duration(1000)
		.ease("linear")
	.attr("fill", "red")
    .each("end", repeat);
	};
};


var focus_node = null, highlight_node = null;

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}	
var default_link_color = "#888";

var outline = false;

var highlight_color = "blue";
var highlight_trans = 0.1;


function update() { // update the layout
	console.log("update()");
	var links, new_nodes, nodes;
	thisForce.nodes(thisGraph.nodes).links(thisGraph.links).start();
	// create nodes and links
	// (links are drawn with insert to make them appear under the nodes)
	// also define a drag behavior to drag nodes
	// dragged nodes become fixed
    
	nodes = vizz.selectAll('.node').data(thisGraph.nodes, function(d) { return d.id; });
	
	
	
	
	var linkedByIndex = {};
	thisGraph.links.forEach(function(d) {
		linkedByIndex[d.source + "," + d.target] = true;
	});

	function isConnected(a, b) {
			return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
	}
	function hasConnections(a) {
		for (var property in linkedByIndex) {
			s = property.split(",");
			if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) 					return true;
		}
		return false;
	}
	
	var tocolor = "fill";
	var towhite = "stroke";
	if (outline) {
		tocolor = "stroke"
		towhite = "fill"
	}
	
function exit_highlight()
{
	// console.log("exit_highlight");
	highlight_node = null;
	if (focus_node===null)
	{
	// vizz.style("cursor","move");
		if (highlight_color!="white") {
		  // circle.style(towhite, "white");
		  text.style("font-weight", "normal");
		  link.style("stroke", function(o) {return o.color});
		  // link.style("stroke-width", 0.5);
		}
	}
}

function set_focus(d)
{	
if (highlight_trans<1)  {
		circle.style("opacity", function(o) {
			return isConnected(d, o) ? 1 : highlight_trans;
		});

		text.style("opacity", function(o) {
			return isConnected(d, o) ? 1 : highlight_trans;
		});
		
		link.style("opacity", function(o) {
			return o.source.index == d.index || o.target.index == d.index ? 1 : highlight_trans;
		});		
	}
}



function set_highlight(d)
{
	// vizz.style("cursor","pointer");
	if (focus_node!==null) d = focus_node;
	highlight_node = d;
	
	// circle.attr("stroke", 'blue');
	// circle.attr("stroke-width", 25);
	// circle.attr("fill", 'white');
	// d3.select(this).style("fill", "aliceblue");
	console.log(d.title_ru);
	if (highlight_color!="white")
	{
		  // circle.style(towhite, function(o) {
                // return isConnected(d, o) ? highlight_color : o.color;});
				
			text.style("font-weight", function(o) {
                return isConnected(d, o) ? "bold" : "normal";});
            link.style("stroke", function(o) {
		      return o.source.index == d.index || o.target.index == d.index ? highlight_color : ((isNumber(o.score) && o.score>=0)?color(o.score):default_link_color);
            });
            // link.style("stroke-width", function(o) {
		      // return o.source.index == d.index || o.target.index == d.index ? 3 : ((isNumber(o.score) && o.score>=0)?3:0.5);
            // });
	}
}
	
	// circle.on("mouseover", function(){d3.select(this).style("fill", "aliceblue");})
        // .on("mouseout", function(){d3.select(this).style("fill", "white");});
		
		
    new_nodes = nodes
		.enter()
		.append('g')
		.attr('class', 'node')
		.on("mouseover", function(d) {
			// console.log("node mouseover");
			// set_highlight(d);
		})
		// .on("mouseout", function(d) {
			// console.log("exit");
			// exit_highlight();
		// })
		.on('click', (function(d) { // SELECTION
			viz_selected = d;
			$('#editr').val(d.title_ru);
			$('#url').val(d.url);
			$('.divlvl').removeClass('showlevel');
			$('#divlvl'+d.level).addClass('showlevel');
			d3.selectAll('.node').classed('selected', function(d2) { return d2 === d; } );
			d3.selectAll('.link').classed('selected', false);
			
			///dvasgvaa
		}));
		
    // links = vizz.selectAll('.link').data(thisGraph.links, function(d) { return "" + d.source.id + "->" + d.target.id; });
    var DataOfLinks = thisGraph.links.filter(function (d) { 
		// return d.relation === "order"; 
		return d; 
	});
	links = vizz.selectAll('.link').data(DataOfLinks);
    
	
	

	link = links
		.enter()
		.insert('line', '.node')
		.attr('class', 'link')
		.style("marker-end",  "url(#suit)") // Modified line 
		.on('click', (function(d) { // SELECTION
			viz_selected = d;
			d3.select(this)
				.attr("stroke-width", 12)
				.attr("stroke", "red");
			d3.selectAll('.link').classed('selected', function(d2) { return d2 === d; });
			return d3.selectAll('.node').classed('selected', false);
		}));
    
	links.exit().remove();
	
	
	
    edgepaths = vizz.selectAll(".edgepath")
        .data(DataOfLinks)
        .enter()
        .append('path')
        .attr({'d': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},
               'class':'edgepath',
               'fill-opacity':0,
               'stroke-opacity':0,
               'fill':'blue',
               'stroke':'red',
               'id':function(d,i) {return 'edgepath'+i}})
        .style("pointer-events", "none");
	
	edgepaths.attr('d', function(d) {
		  var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
		return path
	});     
	
	 edgelabels = vizz.selectAll(".edgelabel")
        .data(DataOfLinks)
        .enter()
        .append('text')
        .style("pointer-events", "none")
        .attr({'class':'edgelabel',
               'id':function(d,i){return 'edgelabel'+i},
               'dx':80,
               'dy':0,
               'font-size':10,
               'fill':'red'});

	 edgelabels.append('textPath')
        .attr('xlink:href',function(d,i) {return '#edgepath'+i})
        .style("pointer-events", "none")
        .text(function(d,i){
			// return 'label '+i
			// return d.relation + " "+i;
			return d.relation;
		});

    
    
    if (cur_tool === 'add_link') {
		// new_nodes.call(drag_add_link); // could be a problem?!
    } else {
		new_nodes.call(dragProcessor);
    }
	
	

	
    circle = new_nodes
		// .append("path")
		// .style("stroke", "black")
		// .style("fill", "white")
		// .attr("d", d3.svg.symbol().size(200).type('circle'))
		.append('circle')
		.classed("dot", true)
		.attr('r', function(d){ 
			d.level = d.level ? d.level : 1;
			return scale2lvl(d.level);
		})
		.attr('stroke', function(d) { 
			// return cat10colorize(d.type); 
			return d.color;
		})
		.attr('stroke-width', stroke_width)
		.attr('fill', function(d) { 
			// return d3.hcl(cat10colorize(d.type)).brighter(3); 
			return d3.hcl(d.color).brighter(d.level); 
		})
		.on("mouseover", function(d){
			set_highlight(d);
			if (!selected2edit){
				d3.select(this).style("stroke", "blue");
				d3.select(this).style("stroke-width", 3);
			}
		})
        .on("mouseout", function(d){
			exit_highlight(d);
			if (!selected2edit){
				d3.select(this).style("stroke", d.color);
				d3.select(this).style("stroke-width", stroke_width);
			}
		})
		.on("click", function(d){
			// if (pulsing) {
				// pulsing.attr("fill", pulsing.precolor);
				// pulsing.transition();
			// }
			// if (pulsing && pulsing.id === d.id){
				// pulsing = null;
			// } else {
				// pulsing = d3.select(this);
				// pulsing.precolor = d3.hcl(d.color).brighter(d.level);
				// pulsing.id = d.id;
				// gogo(pulsing);
				
			// }
			if (selected2edit) {
				if (selected2edit === this){
					d3.selectAll('.link').style('opacity', 1);
					d3.selectAll('.node').style('opacity', 1);
					selected2edit = null;
				}					
			} else {
				selected2edit = this;
				d3.selectAll('.node')
					.filter(function (x) { return d.id != x.id; })
					.style('opacity', 0.2);
				d3.selectAll('.link').style('opacity', 0.2);
				// d3.select(this).style('opacity', 1);
				// var dots2hide = d3.selectAll('.dot');
				// dots2hide
					// .filter(function (x) { return d.id != x.id; })
					// .style('opacity', 0);
				// d3.select(this).attr("stroke-dasharray", function(d) { return (d.level + 1) + ",5"; });				
			}
		})
		;
		
		;
		
		////////////////////////////////////////////
		
			vizz.append("defs").selectAll("marker")
      // .data(["suit"]) 
      .data(DataOfLinks) 
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    // .attr("refX", 25)
	.attr("refX", function(link, idx){
        // return  10 + link.target.size;
		console.log(link);
        // return  100 + scale2lvl (link.target.level);
		return 25;
      })
    .attr("refY", 0)
    .attr("markerWidth", 20)
    .attr("markerHeight", 10)
    .attr("orient", "auto")
  .append("path")
	.attr("d", "M0,-5L10,0L0,5")
    // .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
    .style("stroke", "#4679BD")
    .style("opacity", "0.6")
	;
	
	
	 // vizz.append("svg:defs").selectAll("marker")
      // .data(thisForce.links())
    // .enter().append("svg:marker")
      // .attr("id", function(link, idx){ return 'marker-' + idx})
      // .attr("viewBox", "0 -5 10 10")
      // .attr("refX", function(link, idx){
        // // return  10 + link.target.size;
		// // console.log(link);
        // return  100 + scale2lvl (link.target.level);
      // })
		// .attr("refY", 0)
		// .attr("markerWidth", 6)
		// .attr("markerHeight", 6)
		// .attr("orient", "auto")
		// .append("svg:path")
		// .attr("d", "M0,-5L10,0L0,5")
		
		// .attr("fill", function(link){
		// if(link.type == 'in')
			// return "green";
			// // return "blue";
		// });
	
		
		
		
    // draw the label
    
    text = new_nodes
	.append('text')
	// .text(function(d) { return d.title_ru + " " + d.type; })
	.text(function(d) { 
		// return mode_load? d.title_ru.substring(0, 16) : d.title_ru;
		if(d.title_ru) {
		// return d.title_ru.substring(0, 6);
			return (cur_graph_id === 4) ? d.title_ru.substring(0, 16) : d.title_ru;
		}
	})
	.attr('dy', '0.35em')
	.style('font-size', function(d) {
		return (15-d.level)+'px';
    })
	.attr('fill', function(d) {
		// return cat10colorize(d.type);
		return "#000";
    });
	
     // text.call(wrap, '20');
	
    return nodes.exit().remove();
}	
	
function load_all(error, lesson, userdata, grs) {
	set_id(userdata[0].last_graph);
	
	d3.select('#graphslist')
		.selectAll('li')
		.remove();
		
	d3.select('#graphslist')
		.selectAll('li')
		.data(grs.filter(function(d) {
			if (d.id === cur_graph_id){
				set_title(d.graph_name);
			} else {
				return d.id;
			}
			// return d.id !== cur_graph_id; 
		}))
		.enter()
		.append('li')
		// .filter(function (d) { return d.id !== cur_graph_id;})
		.append('a')
		.attr('href', '#')
		.on("click", function(d) { 
			// console.log(d.id) 
			$.post( "last", { id:d.id }, function (data) {
				console.log("set act: " + data);
				load_queue();
			});
		})
		.text(function(d){ return d.graph_name });
			
	d3.text("load.json?"+cur_graph_id, function(sqldata) {
		dbdata = JSON.parse(JSON.parse(sqldata));
		
		// if (true) {
		if (false) {
			get_from_idx(); // get from IndexDB
			set_id(0);
			set_title('IndexDB')
		} else {
			graph_load(dbdata);
		}
	});
}	


function load_queue (){
queue()
	.defer(d3.json, 'urok.json')
	.defer(d3.json, 'user.json')
	.defer(d3.json, 'list.json')
	.await(load_all);	
}

$(document).ready(function() {
	load_queue();
});

function graph_save (graph) {
	graph_as_string = JSON.stringify(graph);
	console.log((byteCount(graph_as_string)/1024).toFixed(0) + " KB");
	console.log("going to call SAVE");
	$.post( "save", { id:cur_graph_id, name:cur_graph_title, graph:graph_as_string }, function (data) {
		console.log("save res: " + data);
	});
	return;

    var request = indexedDB.open('graph', 2);
    return request.onsuccess = function() { // called when the connection with the DB is opened successfully
		var db = request.result;
		var tx = db.transaction('graph', 'readwrite');
		var store = tx.objectStore('graph');
		store.put({ id: 0, data: graph });
		tx.oncomplete = function() { console.log('IndexedDB->put'); };
		return db.close();
    };
	
	
} 
function get_from_idx(){
	var request = indexedDB.open('graph', 2);
	request.onupgradeneeded = function() {
		var db = request.result;
		var store = db.createObjectStore('graph', { keyPath: 'id' });
		//initial fake data
		// stub_json
		// store.put({
			// id: 0,
			// data: []
		// });
      console.log('IndexedDB->upgrade');
    };
    
	request.onsuccess = function() {
		var db, keyRange, tx;
		db = request.result;
		console.log('IndexedDB->open');
		tx = db.transaction('graph', 'readwrite');
		keyRange = IDBKeyRange.lowerBound(0);
		tx.objectStore('graph').openCursor(keyRange).onsuccess = function(e) {
			var result = e.target.result;
			if (!(result != null)) return;
			
			// $('#pretty').html(JSON.stringify(result.value.data, null, 2));
			// console.log("pretty");
			// $(document).ready(function() {
			  // $('pre code').each(function(i, block) {
				// hljs.highlightBlock(block);
			  // });
			// });
			
			graph_load(result.value.data);
			return result["continue"]();
		};
		tx.oncomplete = function() { console.log('IndexedDB->fetch') };
		db.close();
    };	
}

function graph_create (){

	thisGraph = stub_json;
	console.log(thisGraph);
	cur_graph_title="New Graph";
	set_id(0);
	graph_save (thisGraph);
	// id:cur_graph_id, name:cur_graph_title, graph:graph_as_string
}
function graph_load (graph) { // get data from the DB
		var container, library, svg, toolbar;
		thisGraph = graph;
		// console.log(graph);
		// thisGraph = null;
		// if (!thisGraph) {
			// thisGraph  = existing_graph;
		// }
		
		// thisGraph = stub_json;
		// thisGraph = dbdata;
		// console.log(thisGraph);
		
		// if (location.hostname === "graph.dev") {
				// console.log("load from JSON");
				// thisGraph = dataset;
		// }

 // d3.select("#control")
        // .style("left", "10px")
        // .style("top",  "10px");
		
		 // $(".col2").fadeOut("slow");
		 if (mode_edit === false) {
			 $(".colmask").removeClass('rightmenu');
			 $(".col2").fadeOut("slow").remove();
			 console.log($(window).width());
			 width = $(window).width();
			 height = $(window).height();
			 height -=30;
		 }
		 
		
		thisGraph.objectify = function() {
		  // resolve node IDs (not optimized at all!)
		  var l, n, _i, _len, _ref, _results;
		  _ref = thisGraph.links;
		  _results = [];
		  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
		    l = _ref[_i];
		    _results.push((function() {
				var _j, _len2, _ref2, _results2;
				_ref2 = thisGraph.nodes;
				_results2 = [];
				for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
				  n = _ref2[_j];
				  if (l.source === n.id) {
				    l.source = n;
				    continue;
				  }
				  if (l.target === n.id) {
				    l.target = n;
				    continue;
				  } else {
				    _results2.push(void 0);
				  }
				}				
				return _results2;
		    })());
		  }
		  return _results;
		};
		thisGraph.remove = function(condemned) {
		  // remove the given node or link from the graph, also deleting dangling links if a node is removed
		    if (__indexOf.call(thisGraph.nodes, condemned) >= 0) {
		    thisGraph.nodes = thisGraph.nodes.filter(function(n) {
				return n !== condemned;
		    });
		    return thisGraph.links = thisGraph.links.filter(function(l) {
				return l.source.id !== condemned.id && l.target.id !== condemned.id;
		    });
		  } else if (__indexOf.call(thisGraph.links, condemned) >= 0) {
		    return thisGraph.links = thisGraph.links.filter(function(l) {
				return l !== condemned;
		    });
		  }
		};
		thisGraph.add_node = function(type) {
		  var n;
		  n = {
			id: thisGraph.last_index++,
			// x: width / 2,
			// y: height / 2,
			x: 100,
			y: 100,
			// px: 100,
			// py: 100,
			type: type,
			color: "#2CA02C",
			level: 2,
			title_ru: ''
			// title_en: '',
			// name_ru: '',
			// name_en: ''
		  };
		  thisGraph.nodes.push(n);
		  return n;
		};
		thisGraph.add_link = function(source, target) {
		  // avoid links to self
		  
		  var l, link, _i, _len, _ref;
		  if (source === target) return null;
		  // avoid link duplicates
		  
		  _ref = thisGraph.links;
		  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
		    link = _ref[_i];
		    if (link.source === source && link.target === target) return null;
		  }
		  l = {
		    source: source,
		    target: target
		  };
		  thisGraph.links.push(l);
		  return l;
		};
		thisGraph.serialize = function() {
        /* PERSISTENCE - return a copy of the graph, with redundancies (whole nodes in links pointers) removed. also include the last_index property, to persist it also
        */
		thisGraph.nodes.forEach(function(d, i) { 
			// console.log(d.title_ru + " " + i); 
			// d.color = (d.type === "W" ? "#D62728": "#2CA02C");
			// d.color = "yellow";
			// console.log (d.title_ru, d.x, d.y);
			// d.x = d.x + 10;
			// d.px = d.px + 10;
			// d.y = d.y + 30;
			// d.py = d.py + 30;
			// if(d.type === "Y"){
				// d.color = "#2CA02C";
			// }
			
			// if(d.type === "W"){
				// d.color = "#D62728";
			// }
			
			
			// if(d.type === "Z"){
				// d.color = "#2CA02C";
			// }
			
			// if(d.type === "X"){
				// // d.color = "#1F77B4"; // blue
				// d.color = "#2CA02C";
				// // if (d.level === 4){
					// // d.level = 3;
				// // }
			// }
		});
		
        var l;
        return {
          nodes: thisGraph.nodes,
          links: (function() {
            var _i, _len, _ref, _results;
            _ref = thisGraph.links;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              l = _ref[_i];
			  // console.log(l.relation);
              _results.push({
                source: l.source.id,
                target: l.target.id,
				relation: l.relation
              });
            }
			
            return _results;
          })(),
          last_index: thisGraph.last_index
      
		};
		};
		thisGraph.objectify();
		
		// create the SVG
		
	d3.select("#all > svg").remove();
	
	svg = d3.select('#all')
		.append('svg')
		.attr('width', width)
		.attr('height', height);
	
	cat10colorize = d3.scale.category10();
	  
	var borderPath = svg.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("height", height)
		.attr("width", width)
		.style("stroke", "navy")
		.style("fill", "none")
		.style("stroke-width", '1px');
			
			
			
	// ZOOM and PAN
	// create container elements
	
	container = svg.append('g');
	container.call(d3.behavior.zoom().scaleExtent([0.5, 8]).on('zoom', (function() {
		  return vizz.attr('transform', "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	})));
	
	vizz = container.append('g');
		// create a rectangular overlay to catch events
		// WARNING rect size is huge but not infinite. this is a dirty hack
		
	vizz
		.append('rect')
		.attr('class', 'overlay')
		.attr("fill", "transparent")
		.attr('x', -500000)
		.attr('y', -500000)
		.attr('width', 1000000)
		.attr('height', 1000000)
		.on('click', (function(d) { // click on blank area
			viz_selected = null;
			d3.selectAll('.node').classed('selected', false);
			d3.selectAll('.link').classed('selected', false);
		})); // END ZOOM and PAN
		
		
	// initialize the force layout
	thisForce = d3.layout.force()
		.size([width, height])
		.charge(-500) // -500
		.linkDistance(100) //10
		.on('tick', (function() {
			// update nodes and links
			
	 edgepaths.attr('d', function(d) { var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
                                           //console.log(d)
                                           return path});     

        edgelabels.attr('transform',function(d,i){
            if (d.target.x<d.source.x){
                bbox = this.getBBox();
                rx = bbox.x+bbox.width/2;
                ry = bbox.y+bbox.height/2;
                return 'rotate(180 '+rx+' '+ry+')';
                }
            else {
                return 'rotate(0)';
                }
        });
		
		
			
			vizz.selectAll('.node').attr('transform', function(d) { return "translate(" + d.x + "," + d.y + ")"; });
			return vizz.selectAll('.link')
			.attr('x1', function(d) { return d.source.x; })
			.attr('y1', function(d) { return d.source.y; })
			.attr('x2', function(d) { return d.target.x; })
			.attr('y2', function(d) { return d.target.y; });
			})
		);
		
	// DRAG
	dragProcessor = thisForce.drag()
		.on('dragstart', function(d) { return d.fixed = true; })
		.on('dragend', function() { return graph_save( thisGraph.serialize() )});
	  
		/////////////////////
		update();
		bind_events();
		if (!is_picker) {
			draw_colorpicker();
			is_picker =  true;
		}
		/////////////////////
		
	thisLinkAdd = null;
	vizz.on('mousemove.add_link', (function(d) {
	  if (thisLinkAdd != null) { // check if there is a new link in creation
		// update the draggable link representation
		var p = d3.mouse(vizz.node());
		return thisLinkDrag
		.attr('x1', thisLinkAdd.x)
		.attr('y1', thisLinkAdd.y)
		.attr('x2', p[0])
		.attr('y2', p[1]);
	  }
	})).on('mouseup.add_link', (function(d) {
	  thisLinkAdd = null;
	  // remove the draggable link representation, if exists
	  if (thisLinkDrag != null) return thisLinkDrag.remove();
	}));
		

	  
	// PERSISTENCE - store the graph every second, to avoid missing the force layout updates on nodes' position
	// return setInterval((function() {
	  // // console.log(JSON.stringify(thisGraph.serialize()));
	  // return graph_save(thisGraph.serialize());
	// }), 60*1000);
}
function bind_events(){
	// d3.select('#but').on('click', function() { });
	$('#but').click(function(){ 
		// opacity: 0.5;
		d3.selectAll('.link')
		.transition()
		.duration(1000)
		.ease("linear")
		.style('opacity', hide_links);
		d3.selectAll('.edgelabel').style('opacity', hide_links);
		hide_links ^= 1;
		console.log("(un)hide links");	
	});
	$('#ButtonToggleLinkLabels').click(function(){ 
		d3.selectAll('.edgelabel').style('opacity', hide_edges);
		hide_edges ^= 1;
		console.log("(un)hide edges");	
	});
	$('#ButtonToggleLinkLabelsOrder').click(function(){ 
		d3.selectAll('.edgelabel').filter(function (d) { 
		return d.relation === "order"; 
		}).style('opacity', hide_edges_order);
		hide_edges_order ^= 1;
		console.log("(un)hide edges ORDER");	
	});
	$('#ButtonToggleLinkLabelsSection').click(function(){ 
		d3.selectAll('.edgelabel').filter(function (d) { 
		return d.relation === "section"; 
		}).style('opacity', hide_edges_section);
		hide_edges_section ^= 1;
		console.log("(un)hide edges SECTION");	
	});
	$('.divlvl').click(function(){ 
		if (viz_selected != null) {
			$('.divlvl').removeClass('showlevel');
			$(this).addClass('showlevel');
			var lvl = $(this).attr('id').slice(-1);
			console.log("level", lvl);
			viz_selected.level = lvl;
			d3.select('.selected > circle').attr('r', scale2lvl(lvl));
			graph_save(thisGraph.serialize());
		}
	});	
	
	
	$("#btn_save").click( function() {
	  // var text = $("#textarea").val();
	  // var mytext = 'ollo';
	  var mytext = JSON.stringify(thisGraph.serialize());
	  
	  var blob = new Blob([mytext], {type: "application/json;charset=utf-8"});
	  saveAs(blob, cur_graph_title + ".json");
	});
	
	d3.select(window)
	.on('keydown', function() {
		if (d3.event.keyCode === 16 && cur_tool !== 'add_link') {
			console.log("SHIFT DOWN");
			
			var nodes = vizz.selectAll('.node');
			nodes.on('mousedown.drag', null).on('touchstart.drag', null);
			
			nodes.on('mousedown.add_link', function(d) {
				var p;
				thisLinkAdd = d;
				p = d3.mouse(vizz.node()); 
				// create the draggable link representation
				thisLinkDrag = vizz.insert('line', '.node')
				  .attr('class', 'drag_link')
				  .attr('x1', d.x)
				  .attr('y1', d.y)
				  .attr('x2', p[0])
				  .attr('y2', p[1]);
				d3.event.stopPropagation(); // prevent pan activation
				d3.event.preventDefault(); // prevent text selection
			}).on('mouseup.add_link', function(d) {
				console.log("link added");
				// add link and update, but only if a link is actually added
				if ( thisGraph.add_link(thisLinkAdd, d) != null) {
					update();
					return graph_save(thisGraph.serialize());
				}
			});
			cur_tool = 'add_link';			

		}
	})
	.on('keypress', function() {
		// console.log('key', d3.event.keyCode, d3.event.which );
	})
	.on('keyup', function() {
		var key = d3.event.keyCode;
		
		// if ((key >= 48 && key <= 57) || (key >= 96 && key <= 105)) {
			// if (key > 95) { key -= 48; }
			// var keynum = parseInt(String.fromCharCode(key));
			
			// // console.log("num", key, String.fromCharCode(key));
			// //event.preventDefault(); //stop character from entering input
		// } 
		
		// d3.select(this).
		// console.log(d3.event.target.id);
		if (d3.event.target.id && d3.event.target.id === 'cgraph_name'){
			var newtitle = d3.event.target.value;
			cur_graph_title = newtitle;
			// console.log(newtitle);
			$.post( "rename", { id:cur_graph_id, name:newtitle }, function(data) {
				console.log("graph->rename: " + newtitle + ": " + data);
				document.title = newtitle;
			});
		}
		
		if (d3.event.keyCode === 16) {
			console.log("SHIFT RELEASED");
			var nodes = vizz.selectAll('.node');
			nodes.on('mousedown.add_link', null).on('mouseup.add_link', null);
			nodes.call(dragProcessor);
			cur_tool = 'add_node';
		} else if (d3.event.keyCode === 46) {
		////
		} else if (viz_selected != null) {
			var lbl = $('#editr').val();
			viz_selected.title_ru = lbl;
			d3.select('.selected > text').text(lbl);
			
			
			var url = $('#url').val();
			viz_selected.url = url;
			// update();
			graph_save(thisGraph.serialize());
			// console.log(JSON.stringify(thisGraph.serialize()));
			// $('#srlgrph').val(JSON.stringify(thisGraph.serialize()));
		}
	});
	
			
	d3.select('#btn_del_node')
		.on('click', function() {
			if (viz_selected != null) {
				thisGraph.remove(viz_selected);
				viz_selected = null;
				
				if(selected2edit) { // check whether its the same node
					d3.selectAll('.link').style('opacity', 1);
					d3.selectAll('.node').style('opacity', 1);
					selected2edit = null;
				}
			
				update();
				graph_save(thisGraph.serialize());
			}
	});

	d3.select('#btn_add_node')
		.on('click', function() {
			thisGraph.add_node('Y');
			update();
			graph_save(thisGraph.serialize());		  
	});
	
	d3.select('#btn_create_graph')
		.on('click', function() {
			console.log("kind of create, act is ");
			graph_create();
	});
	


}
function draw_colorpicker(){
	var ColorPicker = function (defaultColor, colorScale) {
    var self = this;
    // var rainbow = ["#FFD300", "#FFFF00", "#A2F300", "#00DB00", "#00B7FF", "#1449C4", "#4117C7", "#820AC3", "#DB007C", "#FF0000", "#FF7400", "#FFAA00"];
	



    var rainbow =  [
	// white purple
	"#eee", "#909",
		//green  orange 	blue 		red
	"#2CA02C", "#FF7F0E", "#1F77B4", "#D62728", 
	// "#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477",
	// "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc",
	// "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"
	];
    colorScale = colorScale || rainbow;
    var color = function (i) {
		  return colorScale[i];
    };
    defaultColor = defaultColor || color(0);

    self.pickedColor = defaultColor;
    self.picked = function (color) {};
    var clicked = function () {
		  self.picked(self.pickedColor);
    };

    var pie = d3.layout.pie().sort(null);
    var arc = d3.svg.arc().innerRadius(20).outerRadius(75);

    var svgcanva = d3.select("#colorspace")
		  .append("svg")
		  .attr("width", 200)
		  .attr("height", 200)
		  .append("g")
		  .attr("transform", "translate(110,100)");

    var plate = svgcanva.append("circle")
		  .attr("fill", defaultColor)
		  .attr("stroke", "#fff")
		  .attr("stroke-width", 4)
		  .attr("r", 50)
		  .attr("cx", 0)
		  .attr("cy", 0)
		  .on("click", clicked);

		var arr2d = Array.apply(null, Array(rainbow.length)).map(function(){return 1});
		
    svgcanva.datum(arr2d)
		  .selectAll("path")
		  .data(pie)
		  .enter()
		  .append("path")
		  .attr("fill", function (d, i) {
		  return color(i);
    })
		  .attr("stroke", "black") // #fff
		  .attr("stroke-width", 2)
		  .attr("d", arc)
		  .on("mouseover", function () {
		  var fill = d3.select(this).attr("fill");
		  self.pickedColor = fill;
		  plate.attr("fill", fill);
    })
		  .on("click", clicked);
};

var picker = new ColorPicker();
picker.picked = function (color) {
	if (viz_selected != null) {
		d3.select('.selected > circle').attr('fill', d3.hcl(color).brighter(viz_selected.level));
		d3.select('.selected > circle').attr('stroke', color);
		viz_selected.color = color;
		graph_save(thisGraph.serialize());
	}
    console.log(color);
};
}


