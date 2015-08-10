
var VehicleStage = Class.extend({
  init: function(vehicle, stage) {
    this.vehicle = vehicle;

    this.name       = stage.name;
    this.components = [];

    for(var i=0; i<stage.components.length; i++) {
      this.components.push(new VehicleComponent(this, stage.components[i]));
    }
  },

  draw: function(cc) {
    for(var i=0; i<this.components.length; i++) {
      this.components[i].draw(cc);
    }
  },

  mousemove: function(pos, component) {
    for(var i=0; i<this.components.length; i++) {
      var x = this.components[i].mousemove(pos, component);
      if(x) component = x;
    }
    return component;
  },

});

var VehicleComponent = Class.extend({
  init: function(stage, component) {
    this.stage     = stage;
    this.vehicle   = stage.vehicle;
    this.component = component;

    this.states = {};

    var copy = ["annotation", "image_name", "position", "name", "purpose", "annotation_type", "minor"];

    var i;
    
    if(component.states) {
      this.states = component.states;
      for(i in this.states) {
        var state = this.states[i];
        for(var j=0; j<copy.length; j++) {
          if(!(copy[j] in this.states[i]))
            this.states[i][copy[j]] = component[copy[j]];
        }
      }
    } else {
      this.states.default = {};
      for(i=0; i<copy.length; i++) {
        this.states.default[copy[i]] = component[copy[i]];
      }
    }

    this.position = component.position;

    this.current_state = component.state || "default";

    this.load_images();

    this.fade = 0;
  },

  load_images: function() {
    var component = this;

    function onload_handler(i) {
      return function() {
        component.image_loaded.call(component, i);
      };
    }
    
    for(var i in this.states) {
      var state = this.states[i];
      state.image = new Image();
      state.image.src = "vehicles/" + this.vehicle.id + "/" + state.image_name + ".png";
      state.image.onload = onload_handler(i);
    }
  },

  image_loaded: function(state) {
    this.vehicle.draw();
  },

  get_name: function(state) {
    return state.name || this.component.name;
  },
  
  get_purpose: function(state) {
    return state.purpose || this.component.purpose;
  },

  mousemove: function(pos, component) {
    var state = this.states[this.current_state];
    if(component) return false;
    
    if(state.position) {
      if(pos[0] > this.vehicle.size[0] * 0.5 + state.position[0] &&
         Math.abs(pos[1] - state.position[1]) < 16) {
        return this;
      }
    }
    
  },

  draw_annotation_line: function(cc, offset, line_width, right_padding, color) {
    cc.beginPath();
    cc.moveTo(offset, 0);
    cc.lineTo(this.vehicle.size[0] * 0.5 - right_padding, 0);

    cc.lineWidth = line_width;
    cc.strokeStyle = color;
    cc.stroke();
  },
  
  draw_annotation_dot: function(cc, offset, dot_radius, line_width, right_padding, color) {
    cc.beginPath();
    cc.arc(offset, 0, dot_radius, 0, Math.PI * 2);
    
    cc.fillStyle = color;
    cc.fill();

    this.draw_annotation_line(cc, offset, line_width, right_padding, color);
  },
  
  draw_annotation_arrow: function(cc, offset, dot_radius, line_width, right_padding, color) {
    cc.beginPath();
    cc.moveTo(offset + dot_radius, -dot_radius);
    cc.lineTo(offset, 0);
    cc.lineTo(offset + dot_radius, dot_radius);

    cc.lineWidth = line_width;
    
    cc.strokeStyle = color;
    cc.stroke();

    this.draw_annotation_line(cc, offset, line_width, right_padding, color);
  },
  
  draw_state: function(cc, state_name) {
    var state = this.states[state_name];

    var tempcanvas = $("<canvas>");
    var tc = tempcanvas.get(0).getContext("2d");
    tc.canvas.width  = this.vehicle.size[0];
    tc.canvas.height = this.vehicle.size[1];

    if(this.vehicle.hover_component == this) {

      var buffercanvas = $("<canvas>");
      var bc = buffercanvas.get(0).getContext("2d");
      bc.canvas.width  = this.vehicle.size[0];
      bc.canvas.height = this.vehicle.size[1];
      
      bc.fillStyle = "#38f";
      bc.globalAlpha = 0.5;
      bc.fillRect(0, 0, this.vehicle.context.canvas.width, this.vehicle.context.canvas.height);
      bc.globalAlpha = 1;
      bc.globalCompositeOperation = "destination-atop";
      bc.drawImage(state.image, 0, 0);

      tc.drawImage(bc.canvas, 0, 0);
    } else {
      tc.drawImage(state.image, 0, 0);
    }

    cc.drawImage(tc.canvas, 0, 0);
    
    if(state.annotation) {
      var minor   = state.minor || false;
      var pos     = state.position;
      var name    = this.get_name(state_name).toUpperCase();
      var purpose = this.get_purpose(state_name);
      var type    = state.annotation_type || "dot";

      if(!pos) return;

      pos = [pos[0], pos[1]];

      cc.save();
      cc.translate(this.vehicle.size[0] * 0.5, pos[1]);

      var dot_radius    = 4;
      var line_width    = 2;
      var edge          = 2;
      var right_padding = 12;

      var color = "#404040";
      if(minor) color = "#aaa";
      if(this.vehicle.hover_component == this) color = "#26a";
      
      if(type == "dot") {
        this.draw_annotation_dot(cc, pos[0], dot_radius + edge, line_width + edge * 2, right_padding, "#fff");
        this.draw_annotation_dot(cc, pos[0], dot_radius, line_width, right_padding, color);
      } else if(type == "arrow") {
        this.draw_annotation_arrow(cc, pos[0], dot_radius + edge, line_width + edge * 2, right_padding, "#fff");
        this.draw_annotation_arrow(cc, pos[0], dot_radius, line_width, right_padding, color);
      }
      
      cc.font = "16px Oswald";
      cc.fillStyle = color;
      cc.fillText(name, this.vehicle.size[0] * 0.5, 6);

      var name_width = cc.measureText(name).width;
      
      cc.font = "16px Oswald";
      cc.fillStyle = color;
      cc.fillText(purpose, name_width + 8 + this.vehicle.size[0] * 0.5, 6);

      cc.restore();
    }
    
  },

  draw: function(cc) {
    this.draw_state(cc, this.current_state);
  },

  cycle_state: function() {
    if(this.component.state_cycle) {
      var next_state = this.component.state_cycle.indexOf(this.current_state) + 1;
      next_state = next_state % this.component.state_cycle.length;
      this.current_state = this.component.state_cycle[next_state];
    }
  },

  clicked: function() {
    this.cycle_state();
  }

});

var Vehicle = Class.extend({
  init: function(url, id) {
    this.id   = id;
    this.url  = url;

    var vehicle = this;

    var li = $("<li><a></a></li>");
    li.find("a").attr("data-id", id);
    li.find("a").attr("href", "#" + id);
    li.find("a").addClass("set-vehicle");
    $("nav.secondary ul").append(li);

    $.get(url)
      .done(function(data) {
        vehicle.loaded.call(vehicle, data);
      })
      .fail(function() {
        vehicle.failed.call(vehicle);
      });

    this.canvas = $("<canvas>");
    this.context = this.canvas.get(0).getContext("2d");
    
    this.canvas.click(function(e) {
      vehicle.clicked.call(vehicle, e);
    });

    this.canvas.mousemove(function(e) {
      vehicle.mousemove.call(vehicle, e);
    });

    $(window).resize(function() {
      vehicle.draw.call(vehicle);
    });
    
    this.ready = false;

    this.hover_component = null;
  },

  // VERIFY

  verify: function(data) {
    return(
      this.verify_root(data) &&
        this.verify_stages(data.stages)
    );
  },

  verify_root: function(data) {
    if(("name" in data) &&
       ("size" in data) &&
       ("stages" in data))
      return true;
  },

  verify_stage: function(stage) {
    if(("name" in stage) &&
       ("components" in stage) && (typeof stage.components == typeof [])) return true;
  },
  
  verify_stages: function(stages) {
    var valid = true;
    for(var i=0; i<stages.length; i++) {
      var stage = stages[i];
      valid &= this.verify_stage(stage);
    }
    return valid;
  },

  // PARSE

  loaded: function(data) {
    if(!this.verify(data)) {
      console.warn("invalid file " + this.url);
      return;
    }

    this.size = data.size;
    
    this.name = data.name;
    this.obsolete = data.obsolete || false;

    $("nav.secondary a[data-id=" + this.id + "]").text(this.name);
    if(this.obsolete)
      $("nav.secondary a[data-id=" + this.id + "]").addClass("obsolete");

    this.stages = [];

    for(var i=0; i<data.stages.length; i++) {
      this.stages.push(new VehicleStage(this, data.stages[i]));
    }

    this.ready = true;

    this.draw();
  },

  failed: function() {
    console.warn("failed to get/parse file " + this.url);
  },

  clicked: function(e) {
    var offset = $(this.canvas).parent().offset();
    var pos = [e.pageX - offset.left,
               e.pageY - offset.top];

    if(this.hover_component) {
      this.hover_component.clicked();
    } else {
      this.pos = pos;
      console.log(pos);
    }
    this.draw();
  },

  mousemove: function(e) {
    var offset = $(this.canvas).parent().offset();
    var pos = [e.pageX - offset.left,
               e.pageY - offset.top];

    var component = null;
    for(var i=0; i<this.stages.length; i++) {
      var x = this.stages[i].mousemove(pos, component);
      if(x) component = x;
    }

    this.hover_component = component;

    if(this.hover_component) {
      this.set_cursor("pointer");
    } else {
      this.set_cursor("auto");
    }

    this.draw();

  },

  set_cursor: function(cursor) {
    this.canvas.css("cursor", cursor);
  },

  draw: function() {
    if(!this.ready) return;
    var cc = this.context;
    cc.canvas.width = $(window).width();
    cc.canvas.height = this.size[1];

    for(var i=0; i<this.stages.length; i++) {
      this.stages[i].draw(cc);
    }

    if(this.pos && false) {
      cc.fillStyle = "#404040";
      cc.beginPath();
      cc.arc(this.pos[0], this.pos[1], 4, 0, Math.PI * 2);
      cc.fill();
    }
  },

  hide: function() {
    this.canvas.detach();
  },
  
  show: function() {
    $("#vehicle-canvas").append(this.canvas);
  },
});

var VEHICLES = [];
var VEHICLE  = null;

function vehicle_init() {
  $(window).on("hashchange", function() {
    vehicle_set_from_hash();
  });

  vehicle_load("falcon9-v11");

  vehicle_set_from_hash();
}

function vehicle_set(vehicle) {
  $("a.set-vehicle").removeClass("active");
  $("a.set-vehicle[data-id=" + vehicle + "]").addClass("active");
  if(VEHICLE) VEHICLE.hide();
  VEHICLE = VEHICLES[vehicle];
  VEHICLE.show();
}

function vehicle_set_from_hash() {
  if(location.hash.length < 2) {
    vehicle_set("falcon9-v11");
  } else {
    var hash = location.hash.substr(1);
    vehicle_set(hash);
  }
}

function vehicle_load(name) {
  var url = "vehicles/" + name + ".json";
  VEHICLES[name] = new Vehicle(url, name);
}
