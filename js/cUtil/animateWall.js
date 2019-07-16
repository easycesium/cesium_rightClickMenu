function AnimationLineMaterialProperty(options) {
    //options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._colorSubscription = undefined;
    this.color = options.color || defaultColor; //颜色
    this._duration = options.duration || 1000; //时长
    var _material = AnimationLineMaterialProperty.getImageMaterial(options.url, options.repeat);
    this._materialType = _material.type; //材质类型
    this._materialImage = _material.image; //材质图片
    this._time = undefined;
}

Cesium.defineProperties(AnimationLineMaterialProperty.prototype, {
    isConstant: {
        get: function get() {
            return false;
        }
    },
    definitionChanged: {
        get: function get() {
            return this._definitionChanged;
        }
    },
    color: Cesium.createPropertyDescriptor('color')
});

AnimationLineMaterialProperty.prototype.getType = function (time) {
    return this._materialType;
};

AnimationLineMaterialProperty.prototype.getValue = function (time, result) {
    if (!defined(result)) {
        result = {};
    }
    result.color = Property.getValueOrClonedDefault(this._color, time, defaultColor, result.color);
    result.image = this._materialImage;
    if (this._time === undefined) {
        this._time = time.secondsOfDay;
    }
    result.time = (time.secondsOfDay - this._time) * 1000 / this._duration;
    return result;
};

AnimationLineMaterialProperty.prototype.equals = function (other) {
    return this === other || //
    other instanceof AnimationLineMaterialProperty && Property.equals(this._color, other._color);
};
var cacheIdx = 0;
var nameEx = "AnimationLine";
AnimationLineMaterialProperty.getImageMaterial = function (imgurl, repeat) {
    cacheIdx++;
    var typeName = nameEx + cacheIdx + "Type";
    var imageName = nameEx + cacheIdx + "Image";
	Material = Cesium.Material;
    Material[typeName] = typeName;
    Material[imageName] = imgurl;
	Cesium.Material.PolylineTrailLinkType = 'PolylineTrailLink';
    Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineTrailLinkType, {
        fabric: {
            type: Cesium.Material.PolylineTrailLinkType,
            uniforms: {
                color: new Cesium.Color(1, 0, 0, 1.0),
                image: Material[imageName],
                time: 0,
                repeat: repeat || new _Cesium2.default.Cartesian2(1.0, 1.0)
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
        translucent: function translucent() {
            return true;
        }
    });
    return {
        type: Material[typeName],
        image: Material[imageName]
    };
};
