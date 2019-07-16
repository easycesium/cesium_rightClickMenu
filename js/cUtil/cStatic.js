/*静态类,封装多种静态方法 --by czl*/
var _cStatic = {
	cartesianToLnglat: function(cartesian) { //世界坐标转经纬度
		var ellipsoid = viewer.scene.globe.ellipsoid;
		var lnglat = ellipsoid.cartesianToCartographic(cartesian);
		var lat = Cesium.Math.toDegrees(lnglat.latitude);
		var lng = Cesium.Math.toDegrees(lnglat.longitude);
		var hei = lnglat.height;
		return [lng, lat, hei];
	},
	onSurfaceDistance: function(pt1, pt2) { //地球表面距离
		var ellipsoid = viewer.scene.globe.ellipsoid;
		var dis = -1;
		if (!pt1 || !pt2) return;
		var cg1 = Cesium.Cartographic.fromCartesian(pt1);
		var cg2 = Cesium.Cartographic.fromCartesian(pt2);
		var egd = new Cesium.EllipsoidGeodesic(cg1, cg2, ellipsoid);
		if (egd) dis = egd.surfaceDistance;
		return dis;
	},
	spacePointDistance: function(pt1, pt2) { //空间距离
		var dis = -1;
		if (!pt1 || !pt2) return;
		dis = Cesium.Cartesian3.distance(pt1, pt2);
		return dis;
	},
	onGroundPointDistance: function(positions, callback) { //贴地距离
		$this = this;
		var ellipsoid = viewer.scene.globe.ellipsoid;
		var surfacePositions = Cesium.PolylinePipeline.generateArc({ //将线进行插值
			positions: positions,
			granularity: 0.00001 //间隔
		});
		if (!surfacePositions) return;
		var cartographicArray = [];
		var tempHeight = Cesium.Cartographic.fromCartesian(positions[0]).height;
		for (var i = 0; i < surfacePositions.length; i += 3) {
			var cartesian = Cesium.Cartesian3.unpack(surfacePositions, i); //分组
			cartographicArray.push(ellipsoid.cartesianToCartographic(cartesian));
		}
		Cesium.when(Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, cartographicArray), function(updateLnglats) { //返回计算过地形高度之后的Cartographic
			var allLength = 0;
			var offset = 10.0;
			for (var i = 0; i < updateLnglats.length; i++) {
				var item = updateLnglats[i];
				if (!item.height) { //当未获取到当前坐标下的地形高度时 手动设置为初始点的高度
					item.height = tempHeight;
				} else {
					item.height += offset;
				}
			}
			var raisedPositions = ellipsoid.cartographicArrayToCartesianArray(updateLnglats); //转为世界坐标数组
			for (var z = 0; z < raisedPositions.length - 1; z++) {
				allLength += Cesium.Cartesian3.distance(raisedPositions[z], raisedPositions[z + 1]);
			}
			if (allLength)
				callback(allLength);
		});
	},
	setRotate: function(obj, callback) {
		if (!obj.x || !obj.y) {
			console.log("设定地球旋转时，并未传入经纬度！");
			return;
		}
		var v = obj.v || 1;
		var i = 0;
		var q = obj.q || 1;
		var x = obj.x;
		var y = obj.y;
		var z = obj.z;
		var interVal = window.setInterval(function() {
			x = x + v;
			if (x >= 179) {
				x = -180;
				i++;
			}
			viewer.scene.camera.setView({
				destination: new Cesium.Cartesian3.fromDegrees(x, y, z || 20000000)
			});

			if (i == q) {
				clearInterval(interVal);
				callback();
			}
		}, 16);
	},
	measureByPositions: function(positions) { //方量计算
		var minHeight = 15000;
		for (var i = 0; i < positions.length; i++) {
			var cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
			var height = viewer.scene.globe.getHeight(cartographic);
			if (minHeight > height) minHeight = height;
		}

		var granularity = Math.PI / Math.pow(2, 11);
		granularity = granularity / 64;
		var polygonGeometry = new Cesium.PolygonGeometry.fromPositions({
			positions: positions,
			vertexFormat: Cesium.PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
			granularity: granularity
		});
		var geom = new Cesium.PolygonGeometry.createGeometry(polygonGeometry);
		var totalCutVolume = 0;
		var maxHeight = 0;
		var i0, i1, i2;
		var height1, height2, height3;
		var p1, p2, p3;
		var cartesian;
		var cartographic;
		var bottomArea;
		for (var i = 0; i < geom.indices.length; i += 3) {
			i0 = geom.indices[i];
			i1 = geom.indices[i + 1];
			i2 = geom.indices[i + 2];
			cartesian = new Cesium.Cartesian3(geom.attributes.position.values[i0 * 3], geom.attributes.position
				.values[i0 * 3 + 1], geom.attributes.position.values[i0 * 3 + 2]);

			cartographic = Cesium.Cartographic.fromCartesian(cartesian);
			height1 = viewer.scene.globe.getHeight(cartographic);
			p1 = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0 /*height1 + 1000*/ );

			if (maxHeight < height1) maxHeight = height1;

			cartesian = new Cesium.Cartesian3(geom.attributes.position.values[i1 * 3], geom.attributes.position
				.values[i1 * 3 + 1], geom.attributes.position.values[i1 * 3 + 2]);

			cartographic = Cesium.Cartographic.fromCartesian(cartesian);
			height2 = viewer.scene.globe.getHeight(cartographic);

			var p2 = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0 /*height2 + 1000*/ );

			if (maxHeight < height2) maxHeight = height2;

			cartesian = new Cesium.Cartesian3(geom.attributes.position.values[i2 * 3], geom.attributes.position
				.values[i2 * 3 + 1], geom.attributes.position.values[i2 * 3 + 2]);

			cartographic = Cesium.Cartographic.fromCartesian(cartesian);
			height3 = viewer.scene.globe.getHeight(cartographic);
			p3 = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0 /*height3 + 1000*/ );

			if (maxHeight < height3) maxHeight = height3;

			bottomArea = this.computeAreaOfTriangle(p1, p2, p3);
			totalCutVolume = totalCutVolume + bottomArea * (height1 - minHeight + height2 - minHeight + height3 -
				minHeight) / 3;
		}

		return {
			maxHeight: maxHeight,
			totalCutVolume: totalCutVolume
		}

	},
	computeAreaOfTriangle: function(pos1, pos2, pos3) {
		if (!pos1 || !pos2 || !pos3) {
			console.log("传入坐标有误！");
			return;
		}
		var a = Cesium.Cartesian3.distance(pos1, pos2);
		var b = Cesium.Cartesian3.distance(pos2, pos3);
		var c = Cesium.Cartesian3.distance(pos3, pos1);
		var S = (a + b + c) / 2;
		return Math.sqrt(S * (S - a) * (S - b) * (S - c));
	}
}

var cCesium = (function() {
	//cesium里通用的方法 
	//修改模型高度
	function changeTilesetHeight(tileset, heightOffset) {
		if (!tileset || !heightOffset) return;
		var boundingSphere = tileset.boundingSphere;
		var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
		var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
		var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
		var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
		tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
	}

	//加载模型
	function loadTileset(option) {
		if (!option.url) return;
		var tileset = viewer.scene.primitives.add(
			new Cesium.Cesium3DTileset({
				url: option.url
			})
		);
		tileset.readyPromise.then(function(tileset) {
			//cCesium.changeTilesetHeight(tileset,z);
			option.success(tileset);
		}).otherwise(function(error) {});
	}

	function cartesianToLnglat(cartesian) { //世界坐标转经纬度 
		if (!cartesian) return;
		var ellipsoid = viewer.scene.globe.ellipsoid;
		var lnglat = ellipsoid.cartesianToCartographic(cartesian);
		//var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
		var lat = Cesium.Math.toDegrees(lnglat.latitude);
		var lng = Cesium.Math.toDegrees(lnglat.longitude);
		var hei = lnglat.height;
		return [lng, lat, hei];
	}

	function caratesianArrToLnglatArr(cartesianArr) { //世界坐标数组转经纬度数组
		if (!cartesianArr) return [];
		var lnglatArr = [];
		for (var i = 0; i < cartesianArr.length; i++) {
			var lnglat = cartesianToLnglat(cartesianArr[i]);
			lnglatArr.push(lnglat);
		}
		return lnglatArr;
	}

	function lnglatToCartesian(lnglat) { //经纬度转世界坐标 [101,40]
		if (!lnglat) return null;
		return Cesium.Cartesian3.fromDegrees(lnglat[0], lnglat[1], lnglat[2] || 0);
	}

	function lnglatArrToCartesianArr(lnglatArr) { // [[101,40],[102,42]]
		if (!lnglatArr) return [];
		var arr = [];
		for (var i = 0; i < lnglatArr.length; i++) {
			arr.push(lnglatToCartesian(lnglatArr[i]));
		}
		return arr;
	}

	/* positions：三维笛卡尔数组;
	isMostDetailed：是否获取精确地形高度;
	callback：获取之后的回调函数 
	updateLnglats：回调函数里的参数，为Cartographic类型
	*/
	function getTerrainHeith(positions, isMostDetailed, callback) { //获取多点的地形高度 异步
		if (!positions) return;
		var returnData = function(updateLnglats) {
			var cartographics = [];
			for (var i = 0; i < updateLnglats.length; i++) {
				var nowP = updateLnglats[i];
				if (i == 0) {
					if (!nowP.height) {
						nowP.height = firstH;
					}
				} else {
					var lastP = updateLnglats[i - 1];
					if (!nowP.height) { //如果当前点未返回高度 则和前一个点保持一致
						nowP.height = lastP.height;
					}
				}
				cartographics.push(nowP);
			}
			callback(cartographics);
		}
		
		var ctgp = [];
		for (var i = 0; i < positions.length; i++) {
			var poi = positions[i];
			var lnglat = cartesianToLnglat(poi);
			var c = new Cesium.Cartographic(lnglat[0], lnglat[1]);
			ctgp.push(c);
		}
		var firstH = -1; //初始点的高度
		if (ctgp[0]) firstH = ctgp[0].height;
		var terrainProvider = Cesium.createWorldTerrain();
		if (!isMostDetailed) {
			var promise = Cesium.sampleTerrain(viewer.terrainProvider, 11, ctgp);
			Cesium.when(promise, function(updateLnglats) {
				returnData(updateLnglats);
			});
		} else { //精确获取
			var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, ctgp);
			Cesium.when(promise, function(updateLnglats) {
				returnData(updateLnglats);
			});
		}
	}

	function getModelHeight(position) { //获取position对应的模型上某点的高度
		if (!position) return;
		var cart2 = Cesium.Cartesian2.fromCartesian3(position);
		var cartesian, lnglat;
		if (viewer.scene.pickPositionSupported && Cesium.defined(cart2)) {
			cartesian = viewer.scene.pickPosition(evt.position);
		}
		if (cartesian) lnglat = cartesianToLnglat(cartesian);
		return lnglat[2] || 0;
	}
	
	//对两点进行插值 返回Cartographic数组
	function lerpBetweenPositios(positions) { 
		var ellipsoid = viewer.scene.globe.ellipsoid;
		var surfacePositions = Cesium.PolylinePipeline.generateArc({ //将线进行 细分
			positions: positions,
			granularity: 0.00001 //间隔
		});
		if (!surfacePositions) return;
		var cartographicArray = [];
		for (var i = 0; i < surfacePositions.length; i += 3) {
			var cartesian = Cesium.Cartesian3.unpack(surfacePositions, i); //分组
			cartographicArray.push(ellipsoid.cartesianToCartographic(cartesian));
		}
		return cartographicArray;
	}

	function changeTilesetHeight(tileset, heightOffset) { //修改模型高度
		if (!tileset || !heightOffset) return;
		var boundingSphere = tileset.boundingSphere;
		var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
		var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
		var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
		var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
		tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
	}

	function loadTileset(option, callback) { //加载模型
		if (!option.url) return;
		this.tileset = viewer.scene.primitives.add(
			new Cesium.Cesium3DTileset({
				url: option.url
			})
		);
		this.tileset.readyPromise.then(function(tileset) {
			changeTilesetHeight(tileset, option.height);
			callback(tileset);
		}).otherwise(function(error) {});
	}


	return {
		changeTilesetHeight: changeTilesetHeight,
		loadTileset: loadTileset,
		cartesianToLnglat: cartesianToLnglat,
		caratesianArrToLnglatArr: caratesianArrToLnglatArr,
		lnglatToCartesian: lnglatToCartesian,
		lnglatArrToCartesianArr: lnglatArrToCartesianArr,
		getModelHeight: getModelHeight,
		getTerrainHeith: getTerrainHeith
	}
})();


var cFile = (function() {
	//"文件 相关操作类";
	//============内部私有属性及方法============

	function _download(fileName, blob) {
		var aLink = document.createElement('a');
		aLink.download = fileName;
		aLink.href = URL.createObjectURL(blob);
		document.body.appendChild(aLink);
		aLink.click();
		document.body.removeChild(aLink);
	}


	//下载保存文件
	function downloadFile(fileName, string) {
		var blob = new Blob([string]);
		_download(fileName, blob);
	}


	//下载导出图片
	function downloadImage(name, canvas) {
		var base64 = canvas.toDataURL("image/png");
		var blob = base64Img2Blob(base64);
		_download(name + '.png', blob);
	}

	function base64Img2Blob(code) {
		var parts = code.split(';base64,');
		var contentType = parts[0].split(':')[1];
		var raw = window.atob(parts[1]);
		var rawLength = raw.length;

		var uInt8Array = new Uint8Array(rawLength);
		for (var i = 0; i < rawLength; ++i) {
			uInt8Array[i] = raw.charCodeAt(i);
		}
		return new Blob([uInt8Array], {
			type: contentType
		});
	}
	return {
		download: _download,
		downloadFile: downloadFile,
		downloadImage: downloadImage,
		base64Img2Blob: base64Img2Blob
	};
})();
