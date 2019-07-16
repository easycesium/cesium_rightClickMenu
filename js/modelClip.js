var clipTileset = {
	isActivate:false,
	activate: function() {
		var $this = this;
		loadTileset({
			url:"http://data.marsgis.cn/3dtiles/bim-youeryuan/tileset.json",
			height:37
		},function(tileset){
			$this.tileset = tileset;
			//tileset.debugShowBoundingVolume = true
			//viewer.scene.globe.depthTestAgainstTerrain = false;
			viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0.5, -0.2, tileset.boundingSphere.radius * 5.0));
		});
	},
	disable:function(){
		if(this.clippingPlanes){
			var plans = this.clippingPlanes.planes;
			for(var i = 0;i< planes.length;i++){
				this.clippingPlanes.remove(planes[i]);
			}
			this.clippingPlanes.destroy();
			this.clippingPlanes = null;
		}
// 		if(this.tileset){
// 			viewer.scene.primitives.remove(this.tileset);
// 			this.tileset.destroy();
// 			this.tileset = null;
// 		}
//		this.fx = 0;
	},
	tileset: null,
	clippingPlanes:null,
	updateTileset:function(url){
		if(this.tileset){
			viewer.scene.primitives.remove(this.tileset);
			this.tileset.destroy();
			this.tileset = null;
		}
		loadTileset({
			url:url,
		},function(tileset){
			viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0.5, -0.2, tileset.boundingSphere.radius * 5.0));
		});
	},
	fx: 0,
	createClippingPlanes: function(type) {
		if (!type) return;
		var planes;
		switch (type) {
			case 1: //水平切底部
				this.fx = -1;
				planes = [
					new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, 1), 1), //z水平面
				];
				break;
			case 2: //水平切顶部
				this.fx = 1;
				planes = [
					new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 0, -1), 0), //z水平面
				];
				break;
			case 3: //东西方向切1
				this.fx = 1;
				planes = [
					new Cesium.ClippingPlane(new Cesium.Cartesian3(1, 0, 0), 1), //x垂直面
				];
				break;
			case 4: //东西方向切2
				this.fx = 1;
				planes = [
					new Cesium.ClippingPlane(new Cesium.Cartesian3(-1, 0, 0), 1), //x垂直面
				];
				break;
			case 5: //南北方向切1
				this.fx = 1;
				planes = [
					new Cesium.ClippingPlane(new Cesium.Cartesian3(0, 1, 0), 1), //y垂直面
				];
				break;
			case 6: //南北方向切2
				this.fx = 1;
				planes = [
					new Cesium.ClippingPlane(new Cesium.Cartesian3(0, -1, 0), 1), //y垂直面
				];
				break;
		}
		var clippingPlanes = new Cesium.ClippingPlaneCollection({
			planes: planes,
			edgeWidth: 2,
			edgeColor:Cesium.Color.RED
		});
		this.tileset.clippingPlanes = this.clippingPlanes = clippingPlanes;
	},
	updatePlansDistance: function(value) { 
		if (this.clippingPlanes == null) return;
		var val = this.fx * value;
		for (var i = 0; i < this.clippingPlanes.length; i++) {
			var plane = this.clippingPlanes.get(i);
			plane.distance = val;
		}
	}
}
