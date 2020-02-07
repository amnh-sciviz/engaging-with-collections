var ColorFormula = function(color) {
  this.color = color;
};

ColorFormula.prototype.apply = function(assets) {
  var asset;
  for (var i=0, l=assets.length; i<l; i++) {
    asset = assets[i];
    // set color attribute
    asset.setColor( this.color.r,
                    this.color.g,
                    this.color.b);

  }
}
