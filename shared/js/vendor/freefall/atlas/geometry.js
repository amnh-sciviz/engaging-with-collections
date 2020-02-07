'use strict';
var planeGeom = new THREE.PlaneBufferGeometry(1, 1);
class Geometry {


    constructor(texture) {

        this.texture = texture;
        this.lod = this.texture.lod;
        // console.log( this.lod );

        // create the instanced buffer geometry
        // https://stackoverflow.com/questions/41880864/how-to-use-three-js-instancedbuffergeometry-instancedbufferattribute
        this.geometry = new THREE.InstancedBufferGeometry();
        this.geometry.copy(planeGeom);
        this.geometry.maxInstancedCount = this.texture.getNumItemsMax();
        // console.log(this.geometry.maxInstancedCount);

        // flags dictionary for assets to report update needs
        this.updateFlags = {
            position: false,
            color: false,
            tween: false
        };

        // setup an attribute ditionary
        this.attributes = {};
        // dictionary to retrieve the position
        // of a specific asset in the attribute buffers
        this.bufferPositionsPerAssetIds = {};
        // initialise position in buffer
        this.currPosition = 0;
        // cache array of this geometry's ids
        this.cachedIds = null;
        // setup
        this.setup();
    }

    setup() {
        this.currGeomPos = 0;
        var geom = this.geometry;
        var tex = this.texture;
        // normalize threejs internal uvs attribute buffer

        var uvAttr = geom.getAttribute('uv');
        uvAttr.needsUpdate = true;
        var norm = (tex.assetSize / 16);
        // console.log('setup', tex.width, tex.assetSize);
        for (var i = 0; i < uvAttr.array.length; i++) {
            uvAttr.array[i] /= tex.width;
            // set normalization relative to assetSize (required for LOD)
            uvAttr.array[i] *= norm;
        }

        // define the shader attributes topology
        var attributes = [
            {name: 'tween', size: 1},
            {name: 'uvOffset', size: 2},
            {name: 'translate', size: 3},
            {name: 'translateDest', size: 3},
            {name: 'scale', size: 3},
            {name: 'color', size: 3},
            {name: 'colorDest', size: 3},
            {name: 'uidColor', size: 3, isStatic: true}
        ];

        for (var attr of attributes) {
            // allocate the buffer
            var buffer = new Float32Array(geom.maxInstancedCount * attr.size);
            var buffAttr = new THREE.InstancedBufferAttribute(buffer, attr.size, 1);
            if( !Boolean( attr.isStatic ) ){
                buffAttr.setDynamic(true);
            }
            geom.addAttribute(attr.name, buffAttr);

            // and save a reference in the attr dictionary
            this.attributes[attr.name] = buffAttr;
        }
    }

    append(asset, coords) {

        var id = asset.id;
        var x = coords.x;
        var y = coords.y;
        var w = coords.w;
        var h = coords.h;

        var positionInBuffer;

        // if this asset already has a slot available -
        // that happens when we've removed and are adding back an asset
        if (this.bufferPositionsPerAssetIds[asset.id]) {

            positionInBuffer = this.bufferPositionsPerAssetIds[asset.id];
        }
        // otherwise increment currPosition for the next asset
        else {
            positionInBuffer = this.getNextPosition(asset.id);
        }

        //stores the asset's position in the attribute buffers
        asset.positionInbuffer = positionInBuffer;

        var i1 = positionInBuffer;
        var i2 = positionInBuffer * 2;
        var i3 = positionInBuffer * 3;

        // pct
        var tweens = this.attributes['tween'].array;
        tweens[i1] = 1;

        // coords
        var uvOffsets = this.attributes['uvOffset'].array;
        var textureSize = this.texture.width;
        uvOffsets[i2 + 0] = x / textureSize;
        uvOffsets[i2 + 1] = (textureSize - y - h) / textureSize;

        // size
        var scale = this.attributes['scale'].array;
        var assetSize = this.texture.assetSize;
        scale[i3 + 0] = Math.floor(w / assetSize * 16);
        scale[i3 + 1] = Math.floor(h / assetSize * 16);
        scale[i3 + 2] = 1;

        // translation
        var p = asset.position;
        for (var name of ['translate', 'translateDest']) {
            var buff = this.attributes[name].array;
            buff[i3 + 0] = p.x;
            buff[i3 + 1] = p.y;
            buff[i3 + 2] = p.z;
        }

        // color
        var c = asset.color;
        for (var name of ['color', 'colorDest']) {
            var buff = this.attributes[name].array;
            buff[i3 + 0] = c.r;
            buff[i3 + 1] = c.g;
            buff[i3 + 2] = c.b;
        }
     //   if( asset.uid < 16 )console.log( asset.uid, c.r, c.g, c.b );



        // UID for color picking
        var r = ( asset.uid >> 16 & 0xFF ) / 0xFF;
        var g = ( asset.uid >> 8 & 0xFF ) / 0xFF;
        var b = ( asset.uid & 0xFF ) / 0xFF;
        var buff = this.attributes["uidColor"].array;
        buff[i3 + 0] = r;
        buff[i3 + 1] = g;
        buff[i3 + 2] = b;

        // mark attributes for update
        for (var attr in this.attributes) {
            this.attributes[attr].needsUpdate = true;
        }

        // set asset update flags to this one
        asset.updateFlags = this.updateFlags;

        // discard cache array of ids
        this.cachedIds = null;


        // append asset to 'position in buffer' dictionary
        // if (this.texture.idsList) {
        //   console.log(asset.id, 'taking pos', positionInBuffer);
        // }
        this.bufferPositionsPerAssetIds[asset.id] = positionInBuffer;
        return positionInBuffer;
    }

    getNextPosition(_id) {
        var pos = this.currPosition % this.geometry.maxInstancedCount;
        this.currPosition++;
        return pos;
    }

    // we can't actually remove the geometry so we just give a scale 0 to the
    // instance attribute
    remove(asset) {

        return hide(asset);
        //forbids asset removal from lowest resolution
        // if( this.lod == -1 ){
        //     console.log( "can't remove", asset.id );
        //     return;
        // }

        var i = this.bufferPositionsPerAssetIds[asset.id];
        var scaleBuffer = this.attributes['scale'];
        scaleBuffer.needsUpdate = true;
        // scaleBuffer.array[i * 3 + 0] = 0;
        // scaleBuffer.array[i * 3 + 1] = 0;
        scaleBuffer.array[i * 3 + 2] = -1;
        // /!\ set update flags to null
        // asset.updateFlags = null;
        asset.updateFlags = {};
        // console.log( "remove" );
        renderNeeded = true;
    }


    hide(asset) {
        if( asset.positionInbuffer == -1 ){
            console.warn( "this asset doesn't belong to any geometry");
            return;
        }
        var i = asset.positionInbuffer * 3;
        var scaleBuffer = this.attributes['scale'];
        scaleBuffer.array[ i ] = scaleBuffer.array[ i + 1] = 0;
        scaleBuffer.array[ i + 2] = 1;
        scaleBuffer.needsUpdate = true;
        // asset.updateFlags = null;
        asset.updateFlags = {};
        renderNeeded = true;
    }

    show(asset) {
        if( asset.positionInbuffer == -1 ){
            console.warn( "this asset doesn't belong to any geometry");
            return;
        }
        var i = asset.positionInbuffer * 3;
        var scaleBuffer = this.attributes['scale'];
        var assetSize = this.texture.assetSize;
        scaleBuffer.array[   i   ] = Math.floor( asset.coords.w / assetSize * 16);
        scaleBuffer.array[ i + 1 ] = Math.floor( asset.coords.h / assetSize * 16);
        scaleBuffer.array[ i + 2 ] = 1;
        scaleBuffer.needsUpdate = true;
        // asset.updateFlags = null;
        asset.updateFlags = {};
        renderNeeded = true;
    }

    // called when the asset is not available anymore in this geometry -
    // only happens on dynamic textures such as LOD
    discard(asset) {
        // console.log('deleting', asset.id, 'at pos', this.bufferPositionsPerAssetIds[asset.id]);
        delete this.bufferPositionsPerAssetIds[asset.id];
    }

    applyAttributes(pct) {

        var colorAttr = this.attributes['color'];
        colorAttr.needsUpdate = true;
        var colorArr = colorAttr.array;
        var colorDestArr = this.attributes['colorDest'].array;

        var transAttr = this.attributes['translate'];
        transAttr.needsUpdate = true;
        var transArr = transAttr.array;
        var transDestArr = this.attributes['translateDest'].array;

        var i, i3, position, color;
        if (!this.cachedIds) {
            this.cachedIds = this.getAssetIds();
        }
        var assetId;
        for (var j = 0, l = this.cachedIds.length; j < l; j++) {
            assetId = this.cachedIds[j];
            i = this.bufferPositionsPerAssetIds[assetId];
            i3 = i * 3;
            // position
            transArr[i3 + 0] = transDestArr[i3 + 0] * pct + transArr[i3 + 0] * (1 - pct);
            transArr[i3 + 1] = transDestArr[i3 + 1] * pct + transArr[i3 + 1] * (1 - pct);
            transArr[i3 + 2] = transDestArr[i3 + 2] * pct + transArr[i3 + 2] * (1 - pct);
            // color
            colorArr[i3 + 0] = colorDestArr[i3 + 0] * pct + colorArr[i3 + 0] * (1 - pct);
            colorArr[i3 + 1] = colorDestArr[i3 + 1] * pct + colorArr[i3 + 1] * (1 - pct);
            colorArr[i3 + 2] = colorDestArr[i3 + 2] * pct + colorArr[i3 + 2] * (1 - pct);
        }
        // console.log( "applyAttribute" );
        renderNeeded = true;
    }

    getAssetIds() {
        return Object.keys(this.bufferPositionsPerAssetIds);
    }

    updatePositionAttributes(assets) {
        if (!this.cachedIds) {
            this.cachedIds = this.getAssetIds();
        }
        var attr = this.attributes['translateDest'];
        attr.needsUpdate = true;
        var assetId;
        for (var j = 0, l = this.cachedIds.length; j < l; j++) {
            assetId = this.cachedIds[j];
            var pos = this.bufferPositionsPerAssetIds[assetId];
            var i3 = pos * 3;
            if (!assets[assetId]) {
                console.log('asset not found', assetId);
            } else {
                attr.array[i3 + 0] = assets[assetId].position.x;
                attr.array[i3 + 1] = assets[assetId].position.y;
                attr.array[i3 + 2] = assets[assetId].position.z;
            }
        }
        this.updateFlags.position = false;
        // console.log( "updatePositionAttributes" );
        renderNeeded = true;
    }

    updateColorAttributes(assets) {
        if (!this.cachedIds) {
            this.cachedIds = this.getAssetIds();
        }
        var attr = this.attributes['colorDest'];
        attr.needsUpdate = true;
        var assetId;
        for (var j = 0, l = this.cachedIds.length; j < l; j++) {
            assetId = this.cachedIds[j];
            var pos = this.bufferPositionsPerAssetIds[assetId];
            var i3 = pos * 3;

            if (!assets[assetId]) {
                console.log('color asset not found', assetId);
            } else {
                attr.array[i3 + 0] = assets[assetId].color.r;
                attr.array[i3 + 1] = assets[assetId].color.g;
                attr.array[i3 + 2] = assets[assetId].color.b;
            }
        }
        this.updateFlags.color = false;
        // console.log( "updateColorAttributes" );
        renderNeeded = true;
    }

    updateTweenAttributes(assets) {
        if (!this.cachedIds) {
            this.cachedIds = this.getAssetIds();
        }
        var attr = this.attributes['tween'];
        attr.needsUpdate = true;
        var assetId;
        for (var j = 0, l = this.cachedIds.length; j < l; j++) {
            assetId = this.cachedIds[j];
            var i = this.bufferPositionsPerAssetIds[assetId];

            if (!assets[assetId]) {
                console.log('asset not found', assetId);
            } else {
                attr.array[i] = assets[assetId].tween;
            }
        }
        this.updateFlags.tween = false;
        // console.log( "updateTweenAttributes" );
        renderNeeded = true;
    }
}
