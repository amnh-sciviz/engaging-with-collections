var SphereFormula = function(radius, numSpirals) {
  this.radius = radius || 4500;
  this.numSpirals = numSpirals || 400;
};

SphereFormula.prototype.apply = function(assets) {
  var deltaTheta = 2 / atlas.assets.length;
  var deltaPhi = this.numSpirals * Math.PI / atlas.assets.length;
  var radius = this.radius;
  /*
  var acostheta=-1, theta=0, phi=0;
  var asset;
  for (var i=0, l=assets.length; i<l; i++) {
    asset = assets[i];
    acostheta += deltaTheta;
    theta = Math.acos(acostheta);
    phi += deltaPhi;

    phi = theta = golden_angle * i;
    asset.setPosition(
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(theta),
      radius * Math.sin(theta) * Math.cos(phi));
  }
  //*/


  //from: http://www.softimageblog.com/archives/115

  // assets.sort( function( a, b ){return PRNG.random()> .5 ? -1 : 1; } );
  var n = assets.length;
  var golden_ratio = Math.PI * (3 - Math.sqrt(5));
  var off = 2 / n;
  var p = new THREE.Vector3();
  var y, r, phi;
  for (var i =0; i<n; i++) {

    y = - ( i * off - 1 + (off / 2) );
    r = Math.sqrt(1 - y * y);
    phi = i * golden_ratio;

    assets[i].position = p.set(Math.cos(phi) * r, Math.sin(phi) * r, y).multiplyScalar(radius);
  }


};
