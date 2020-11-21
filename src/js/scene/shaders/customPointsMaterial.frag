uniform vec3 diffuse;
uniform float opacity;
varying float posiY;
uniform sampler2D textures[3];
varying float vTextureIndex;

#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	if (vTextureIndex > 1.5) {
		gl_FragColor = texture2D(textures[0], gl_PointCoord);
	} else if (vTextureIndex > 0.5) {
		gl_FragColor = texture2D(textures[1], gl_PointCoord);
	} else {
		gl_FragColor = texture2D(textures[2], gl_PointCoord);
	}

	#include <premultiplied_alpha_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}
