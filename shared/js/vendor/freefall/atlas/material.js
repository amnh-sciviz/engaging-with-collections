"use strict";

var MaterialVertexShader = `
  precision mediump float;

  // uniform mat4 modelViewMatrix;
  // uniform mat4 projectionMatrix;
  uniform float transitionPct;

  uniform float wavesOffset;
  uniform float wavesAmp;
  // attribute vec3 position;
  // attribute vec2 uv;

  attribute float tween;
  attribute vec2 uvOffset;
  attribute vec3 translate;
  attribute vec3 translateDest;
  attribute vec3 scale;
  attribute vec3 color;
  attribute vec3 colorDest;
  attribute vec3 uidColor;

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vUidColor;
  varying float vTween;

  #define PI 3.14159
  void main() {
    float pct = transitionPct * tween;
    vec3 p = mix( translate, translateDest, pct );//translateDest * pct + translate * (1.0 - pct);

    //original ( grid )
    /*
    if (wavesAmp > 0.0) {
      p.y += sin(wavesOffset+p.x/1200.0) * wavesAmp - sin(wavesOffset+p.z/800.0) * wavesAmp;
    }
    //*/

    //modiffied original to work with a disc and the new size
    if (wavesAmp > 0.0) {
      p.xz *= 1. + 1.0 * wavesAmp;
      p.y += ( sin(wavesOffset+p.x/1800.0) - sin(wavesOffset+p.z/1600.0 ) ) * wavesAmp * 500.;
    }

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vTween = tween;

    mvPosition.xyz += position * scale;
    vUv = uvOffset.xy + uv * scale.xy;

    vColor = mix( color, colorDest, pct );//colorDest * pct + color * (1.0 - pct);

    //picking color
    vUidColor = uidColor;

    // vec4 projection = projectionMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;

  }
`;

var MaterialFragmentShader = `
  precision mediump float;

  uniform sampler2D map;
  uniform float renderUidColor;
  uniform vec3 fogColor;
  uniform float fogDistance;

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vUidColor;
  varying float vTween;

  void main() {

    if( length( vColor ) < .1 )discard;
    
    gl_FragColor = vec4( 0., 0., 0., 1. );
    
    vec4 diffuseColor = texture2D( map, vUv) * vec4(vColor, 1.0) * vTween;
    gl_FragColor += diffuseColor;

     
    if( renderUidColor == 1. ){
        
        gl_FragColor = vec4( vUidColor, 1. );
        
    }

    /*
    else{
    
        //fog
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float d = clamp( 0., 1., pow( depth * ( 1./fogDistance ), 2. ) );
        if( d >= 1. ) discard;
    
        vec4 diffuseColor = texture2D(map, vUv);
        gl_FragColor = diffuseColor * vec4(vColor, 1.0) * vTween;
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, d );
    }
    //*/
  }
`;


var Material = function(texture) {




        // Material.startTime = Material.startTime || Date.now();
        // if( Material.preloader == null ) {
        //
        //     var img = new Image();
        //     img.onload = function(){
        //         Material.preloader = new THREE.Texture( img );
        //         Material.preloader.needsUpdate = true;
        //     };
        //     img.src = "/freefall/data/texture-preloader.png";
        //     Material.preloader = new THREE.Texture();
        // }


        this.material = new THREE.ShaderMaterial({
            uniforms: {
                map: {type: "t", value: texture },
                transitionPct: {type: "f", value: 0.0},
                wavesOffset: {type: "f", value: 0.0},
                wavesAmp: {type: "f", value: 0.0},
                renderUidColor: {type: "f", value: 0.0},

                ///fog
                fogColor: {type: "v3", value: new THREE.Vector3()},
                fogDistance: {type: "f", value: 100000}

            },
            vertexShader: MaterialVertexShader,
            fragmentShader: MaterialFragmentShader,
            depthTest: true,
            depthWrite: true
        });

}
