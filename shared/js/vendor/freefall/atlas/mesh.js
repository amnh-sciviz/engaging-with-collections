'use strict';
var totalAssets = 0.
class Mesh  {

  constructor(texture) {

    this.type = "mesh";
    this.lod = -1;
    texture.texture.minFilter = THREE.LinearFilter;
    texture.texture.magFilter = THREE.LinearFilter;

    this.texture = texture;
    this.geometry = new Geometry(this.texture);
    this.material = new Material(this.texture.texture);
    this.mesh = new THREE.Mesh(this.geometry.geometry, this.material.material);
    this.mesh.frustumCulled = false;
    // dictionary to retrieve assets by their ids
    this.assets = {};
    // setup
    this.setup();
    // animation variables
    this.transitionPctSpeed = 0.01;
    this.transitionPct = 0;
    this.startTime = Date.now();
  }

  setup() {
    // normalize static coordinates
    // console.log(this.texture);
    // const norm = this.texture.width / 2048;
    var norm = this.texture.assetSize / 16;
    var coords;
    for (var i=0, l=this.texture.coords.length; i<l; i++) {
      coords = this.texture.coords[i];
      coords.x *= norm;
      coords.y *= norm;
      coords.w *= norm;
      coords.h *= norm;
      //TODO(cdiagne@): cleaner handling of duplicated assets in atlases
      // this is a tempfix for TED
      if (atlas.getAsset(coords.id)) {
        continue;
      }
      var asset = new Asset({
        id: coords.id,
        coords: coords
      });
      asset.mesh = this;
      // asset.updateFlags = this.updateFlags;
      this.geometry.append(asset, coords, this.updateFlags);
      // update our dictionary indexes
      this.assets[asset.id] = asset;
    }
    totalAssets += this.texture.coords.length;
    // console.log( totalAssets );

  }

  update() {
    // console.log( "mesh.update 0", this.transitionPct );
    if (this.geometry.updateFlags.position || this.geometry.updateFlags.color){
      this.geometry.applyAttributes(this.transitionPct);
      this.transitionPct = 0;
      this.transitionPctSpeed = 0;
      // console.log( "mesh.update 0", this.transitionPct );
    }

    if (this.geometry.updateFlags.position ) {
      this.geometry.updatePositionAttributes(this.assets);
      // console.log( "mesh.update 1", this.transitionPct );
    }

    if( this.geometry.updateFlags.color){
      this.geometry.updateColorAttributes(this.assets);
      // console.log( "mesh.update 2", this.transitionPct );
    }

    if (this.geometry.updateFlags.tween) {
      this.geometry.updateTweenAttributes(this.assets);
      // console.log( "mesh.update 3", this.transitionPct );
    }

    this.updateAnimation();
  }

  // animation is done on the gpu
  // all items have a "position" and "destination" attribute
  // "transitionPct" defines the percentage between these 2 position
  updateAnimation() {

    this.transitionPctSpeed += (0.03 - this.transitionPctSpeed) * 0.01;
    this.transitionPct += (1 - this.transitionPct) * this.transitionPctSpeed;
    if (this.transitionPct < 0.9999) {
      // console.log( "mesh", this.transitionPct );
      renderNeeded = true;
    } else {
      this.transitionPct = 1;
    }
    // console.log( "mesh.updateAnimation", this.transitionPct, renderNeeded );
    var uniforms = this.material.material.uniforms;
    uniforms.transitionPct.value = this.transitionPct;

  }


}
