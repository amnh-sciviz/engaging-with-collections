"use strict";
//min XYZ, max XYZ, block count ( 100 * 100 * 100 ), squared block count
var s = 1000;
var gridSize = new THREE.Vector3(-10000, 10000, s, s*s );

var uidColor = 1;
var Asset = function(){
  function Asset(opts) {
    //picking id 
    this._uid = uidColor++;
    this.grid = new THREE.Vector3();

    this.id = opts.id;

    this.coords = opts.coords;

    //extra
    this.mesh;
    this.positionInbuffer = -1;

    //LOD
    this.lod = -1;
    this.cameraDistance = 0;
    this.image_url  = null;
    this.valid      = true;
    this.needed     = false;
    this.drawn      = false;



    var size = Math.max(this.coords.w, this.coords.h);
    this.sizeNorm = {
      w : this.coords.w / size * 16,
      h : this.coords.h / size * 16
    }

    // create view properties
    this._position = new THREE.Vector3();
    this.grid = new THREE.Vector3();
    this._color = new THREE.Color(1, 1, 1);
    this._tween = 1;

    // define empty flags object
    this.updateFlags = {};
    this.log = [];

    Object.defineProperties( this, {
      "position" : {
        set : function(val) {
          this._position.copy( val );
          this.grid.x = parseInt( map( val.x, gridSize.x, gridSize.y, 0, gridSize.z ) );
          this.grid.y = parseInt( map( val.y, gridSize.x, gridSize.y, 0, gridSize.z ) );
          this.grid.z = parseInt( map( val.z, gridSize.x, gridSize.y, 0, gridSize.z ) );
          this.updateFlags.position = true;
        },
        get : function() {
          return this._position;
        }
      },
      "color" : {
        set : function(val) {
          this.setColor(val.r, val.g, val.b, val.a);
        },
        get : function() {
          return this._color;
        }
      },
      "tween" : {
        set : function(val) {
          this._tween = val;
          this.updateFlags.tween = true;
        },
        get : function() {
          return this._tween;
        }
      },
      "uid" : {
        get : function(){return this._uid; }
      }

    });

  }

  function setPosition(x, y, z) {
    this._position.set(x, y, z);

    this.grid.x = parseInt( map( x, gridSize.x, gridSize.y, 0, gridSize.z ) );
    this.grid.y = parseInt( map( y, gridSize.x, gridSize.y, 0, gridSize.z ) );
    this.grid.z = parseInt( map( z, gridSize.x, gridSize.y, 0, gridSize.z ) );

    this.updateFlags.position = true;
  }

  function setColor(r, g, b) {
    this.color.setRGB(r, g, b);
    this.updateFlags.color = true;
  }
  function show(){
    this.mesh.geometry.show( this );
  }
  function hide(){
    this.mesh.geometry.hide( this );
  }

  var p = Asset.prototype;
  p.setPosition = setPosition;
  p.setColor = setColor;
  p.show = show;
  p.hide = hide;
  return Asset;

}();
