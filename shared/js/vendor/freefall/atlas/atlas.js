'use strict';

// load texture
var count = 0;
var textureLoader = new THREE.TextureLoader();
var STATIC_API = '/data/freefall';
class Atlas {

    constructor(opts) {
        this.opts = opts || {}
        this.container = new THREE.Group();
        // array with all the assets currently available in the atlas
        this.assets = [];
        // array with all the assets' meshes
        this.meshes = [];
        // dictionary to retrieve the current mesh list of a specific asset id
        this.meshesPerAssetId = {};

        this.fogDistance = 50000;
    }

    loadAllStatics(opts, onComplete, onProgress) {
        // retrieve options into a new params object that has default values
        // and extras informations like progress/complete callbacks
        var params = {};
        params.assetSize = opts.assetSize || 16;
        params.atlasSize = opts.atlasSize || params.assetSize * 128;
        params.numAtlasMax = opts.numAtlasMax || 10;
        params.maxAssetPerAtlas = opts.maxAssetPerAtlas || null;
        // add callbacks
        params.onComplete = onComplete;
        params.onProgress = onProgress;
        // start queue
        this.loadNextStatic(0, params);
    }

    loadNextStatic(numLoaded, opts) {
        // infer textures & coords paths
        var texturePath = STATIC_API + '/atlas' + numLoaded + '.jpg';
        var coordsPath = STATIC_API + '/atlas' + numLoaded + '.bin';
        // var coordsPath = STATIC_API + '/data/coords/atlas_' + numLoaded + '.json';
        var loader = this.loadStatic(texturePath, coordsPath, opts.assetSize);
        // launch & handle promise's updates
        loader.then(function(args) {
          // process loaded data
          this.onStaticAtlasLoaded.apply(this, args);
          // mark progress
          numLoaded++;
          if (opts.onProgress) {
            opts.onProgress(numLoaded/opts.numAtlasMax);
          }
          // call onComplete callback if queue is complete
          if (numLoaded == opts.numAtlasMax) {
            if (opts.onComplete) {
              opts.onComplete();
            }
          }
          // otherwise start loading next item
          else {
            this.loadNextStatic(numLoaded, opts);
          }
        }.bind(this));
    }

    // add static (pre-rendered) atlas map by providing a texturePath and a coordsPath
    // assetSize defines the base size of each asset in this texture
    loadStatic(texturePath, coordsPath, assetSize) {
      var promise = new Promise(function(resolve, reject) {
        // load texture
        var texture = textureLoader.load(texturePath, function() {
          // load coords
          this.loadCoords(coordsPath, function(data) {
            resolve([texture, data, assetSize]);
          });
        }.bind(this));
      }.bind(this));
      return promise;
    }

    loadCoords(path, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function (ev) {
        var arrayBuffer = xhr.response;
        var dv = new DataView(arrayBuffer);
        const MID_LENGTH = 14;
        const BYTES_PER_LINE = 21; // byte[MID_LENGTH],byte,ushort,ushort,char,char
        var off = 0;
        var data = [];
        var midbuffer = new ArrayBuffer(MID_LENGTH);
        var miduint8 = new Uint8Array(midbuffer);
        var i;
        while (off < arrayBuffer.byteLength) {
          for (i = 0; i < MID_LENGTH; i++) {
            miduint8[i] = dv.getUint8(off+i);
          }
          data.push({
            id : String.fromCharCode.apply(null, miduint8),
            a : dv.getUint8(off+14),
            x : dv.getUint16(off+15, true) / 4,
            y : dv.getUint16(off+17, true) / 4,
            w : dv.getUint8(off+19, true) / 4,
            h : dv.getUint8(off+20, true) / 4
          });
          off += BYTES_PER_LINE;
        }
        callback(data);
      };
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.send(null);
    }

    onStaticAtlasLoaded(texture, datas, assetSize) {
        // create mesh
        // console.log( "mesh load", count++ )
        // console.log(datas, assetSize)
        var texture = new Texture(texture, datas, assetSize);
        var mesh = new Mesh(texture);
        this.addMesh(mesh);
    }

    addMesh(mesh) {
        console.log(mesh.mesh)
        this.container.add(mesh.mesh);
        this.meshes.push(mesh);

        // TODO (@cdiagne): measure exec time of this - likely slow
        // code below should have no impact on LOD / MOD since the init lod.assets
        // dictionary is empty
        var assetIds = Object.keys(mesh.assets);
        var assetId;
        for (var i = 0, l = assetIds.length; i < l; i++) {
            assetId = assetIds[i];
            this.addAsset(assetId, mesh);
        }

        // turn on render flag
        renderNeeded = true;
    }

    addAsset(assetId, mesh) {
        var meshesPerAssetId = this.meshesPerAssetId;
        var assets = this.assets;
        // update the meshes per assetId dictionary index
        meshesPerAssetId[assetId] = meshesPerAssetId[assetId] || [];
        meshesPerAssetId[assetId].push(mesh);
        // push asset to array
        assets.push(mesh.assets[assetId]);
    }

    // returns an arraw of meshes where this asset is available
    getAssetMeshes(id) {
        return this.meshesPerAssetId[id];
    }

    getAsset(id) {
        var mesh = this.meshesPerAssetId[id];
        if (mesh) {
            // return asset taken from lowest available resolution
            return mesh[0].assets[id];
        }
        return null;
    }
    getOldestAsset( ){
        return this.getAsset( 'PgFQ5eYVxWNuJA' ) || this.assets[2];
    }

    // returns an array of assets from an array of assetIds
    getAssetsFromIds(ids) {
        var result = [];
        var asset;
        for (var i = 0, l = ids.length; i < l; i++) {
            asset = this.getAsset(ids[i]);
            if (asset) {
                result.push(asset);
            }
        }
        return result;
    }

    getAssetsFromIdsDict(idsDict) {
        return this.getAssetsFromIds(Object.keys(idsDict));
    }

    update() {
        // console.time('atlas.update');
        for (var mesh of this.meshes) {
            mesh.update();
        }
        // console.timeEnd('atlas.update');
    }

}
