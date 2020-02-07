"use strict";

// Texture is the base data model since everything about these atlases
// is based on 'rectangles of pixels data'
class Texture {
  constructor(texture, coords, assetSize) {
    
    texture.generateMipmaps = false;
    this.texture = texture;
    this.width = texture.image.width;
    this.height = texture.image.height;
    this.coords = coords;
    this.lod = -1;
    // var cs = []
    // this.coords.forEach(function(c){
    //   if( c.w < c.h )cs.push( c.id )
    // });
    // if( cs.length > 0 )console.log( cs );
    this.assetSize = assetSize;
  }

  // returns the number of items max that the geometry must be able to draw
  // ie : it will define the size of the geometry buffer
  getNumItemsMax() {
    return this.coords.length;
  }
}
