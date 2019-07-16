function cPolylineTrailLinkMaterialProperty(color, duration) {
	this._definitionChanged = new Cesium.Event();
	this._color = undefined;
	this._colorSubscription = undefined;
	this.color = color;
	this.duration = duration;
	this._time = (new Date()).getTime();
}
Cesium.defineProperties(cPolylineTrailLinkMaterialProperty.prototype, {
	isConstant: {
		get: function() {
			return false;
		}
	},
	definitionChanged: {
		get: function() {
			return this._definitionChanged;
		}
	},
	color: Cesium.createPropertyDescriptor('color')
});
cPolylineTrailLinkMaterialProperty.prototype.getType = function(time) {
	return 'animateWallMetrial';
}
cPolylineTrailLinkMaterialProperty.prototype.getValue = function(time, result) {
	if (!Cesium.defined(result)) {
		result = {};
	}
	result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
	result.image = "../img/arrow.png";
	result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;
	return result;

}
cPolylineTrailLinkMaterialProperty.prototype.equals = function(other) {
	return this === other ||
		(other instanceof cPolylineTrailLinkMaterialProperty &&
			Property.equals(this._color, other._color))
}

Cesium.Material._materialCache.addMaterial('animateWallMetrial', {
	fabric: {
		type: 'PolylineTrailLink',
		uniforms: {
			color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
			image: "../img/arrow.png",
			time: 0,
			repeat: new Cesium.Cartesian2(30, 1)
		},
		source: "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
                        {\n\
                            czm_material material = czm_getDefaultMaterial(materialInput);\n\
                            vec2 st = repeat * materialInput.st;\n\
                            vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
                            if(color.a == 0.0)\n\
                            {\n\
                                material.alpha = colorImage.a;\n\
                                material.diffuse = colorImage.rgb; \n\
                            }\n\
                            else\n\
                            {\n\
                                material.alpha = colorImage.a * color.a;\n\
                                material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb); \n\
                            }\n\
                            return material;\n\
                        }"
	},
	translucent: function(material) {
		return true;
	}
});

