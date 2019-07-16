var TilesTool = function(viwer) {
	this.viewer = viewer;
	this.tileset = null;
	this.center = null;
}
TilesTool.prototype = {
	loadTileset: function(option, callback) {
		var $this = this;
		if (!option.url) return;
		this.tileset = this.viewer.scene.primitives.add(
			new Cesium.Cesium3DTileset({
				url: option.url
			})
		);
		this.tileset.readyPromise.then(function(tileset) {
			callback(tileset);
			$this.center = tileset.boundingSphere.center;
		}).otherwise(function(error) {});
	},
	setHeight: function(heightOffset) { //{x,y,z}
		if (!heightOffset) return;
		var boundingSphere = this.tileset.boundingSphere;
		var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
		var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
		var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
		var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
		this.tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
	},
	setPosition: function(x, y, z) {
		var position = Cesium.Cartesian3.fromDegrees(x, y, z);
		var m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
		this.tileset._root.transform = m;
	},
	setRoate: function() {

	},
	getTilesetZ:function(){
		var z = null;
		var center = this.tileset.boundingSphere.center;
		if(center) z = cCesium.cartesianToLnglat(center)[2];
		return  z;
	},
	upateTilesetPosition: function(obj) {
		var rx = obj.rotateX;
		var ry = obj.rotateY;
		var rz = obj.rotateZ;
		var rotationX,rotationY,rotationZ;
		var center = this.tileset.boundingSphere.center;
		var lnglat = cCesium.cartesianToLnglat(center);
		var position = Cesium.Cartesian3.fromDegrees(obj.x||lnglat[0], obj.y||lnglat[1], obj.z||lnglat[2]);
		var m = null;
		if(obj.hasCartesian3){ //兼容世界坐标
			var lnglat = cCesium.cartesianToLnglat(obj.cartesian3);
			m = Cesium.Transforms.eastNorthUpToFixedFrame(obj.cartesian3);
		}else{
			m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
		}
		
		if(rx){
			var mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(rx)); //绕x轴旋转
			rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
			Cesium.Matrix4.multiply(m, rotationX, m);
		}
		if(ry){
			var my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(ry)); //绕y轴旋转
			rotationY = Cesium.Matrix4.fromRotationTranslation(my);
			Cesium.Matrix4.multiply(m, rotationY, m);
		}
		if(rz){
			var mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(rz)); //绕z轴旋转
			rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
			Cesium.Matrix4.multiply(m, rotationZ, m); 
		}
		this.tileset._root.transform = m;
	},
	remove: function() {
		this.viewer.scene.primitives.remove(this.tileset);
		this.tileset = null;
	},
	getPosition: function() {
		var cart3 = this.tileset.boundingSphere.center;
		return cCesium.cartesianToLnglat(cart3);
	}
}
