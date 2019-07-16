var workVolume = {
	options: null,
	totalLable: null, //体积label
	prevEntity: null, //立体边界
	//清除未完成的数据
	clearLastNoEnd: function clearLastNoEnd() {
		if (this.totalLable != null) dataSource.entities.remove(this.totalLable);
		this.totalLable = null;

		if (this.prevEntity != null) dataSource.entities.remove(this.prevEntity);
		this.prevEntity = null;
	},
	//开始绘制
	start: function start(options) {
		this.options = options;

		var entityattr = (0, _AttrLabel.style2Entity)(_labelAttr, {
			horizontalOrigin: _Cesium2.default.HorizontalOrigin.CENTER,
			verticalOrigin: _Cesium2.default.VerticalOrigin.BOTTOM,
			show: false
		});

		this.totalLable = dataSource.entities.add({
			label: entityattr,
			isMarsMeasureLabel: true,
			attribute: {
				unit: this.options.unit,
				type: this.options.type
			}
		});

		drawControl.startDraw({
			type: "polygon",
			style: options.style || {
				color: "#00fff2",
				outline: true,
				outlineColor: "#fafa5a",
				outlineWidth: 1,
				opacity: 0.4,
				clampToGround: true //贴地
			}
		});
	},
	//绘制增加一个点后，显示该分段的长度
	showAddPointLength: function showAddPointLength(entity) {},
	//绘制中删除了最后一个点
	showRemoveLastPointLength: function showRemoveLastPointLength(e) {},
	//绘制过程移动中，动态显示长度信息
	showMoveDrawing: function showMoveDrawing(entity) {},
	//绘制完成后
	showDrawEnd: function showDrawEnd(entity) {
		if (entity.polygon == null) return;

		var positions = entity.polygon.hierarchy.getValue();
		var result = this.computeCutVolume(positions);
		var maxHeight = result.maxHeight;
		var totalCutVolume = result.totalCutVolume;
		var totalCutVolumestr = totalCutVolume.toFixed(2) + "立方米"; ///formatArea(totalCutVolume, this.options.unit);
		//求中心点 
		var centroid = this.computeCentroidOfPolygon(positions);
		var ptcenter = _Cesium2.default.Cartesian3.fromRadians(centroid.longitude, centroid.latitude, maxHeight +
			10);

		this.totalLable.position = ptcenter;
		this.totalLable.label.text = "挖方体积:" + totalCutVolumestr;
		this.totalLable.label.show = true;

		this.totalLable.attribute.value = totalCutVolume;
		this.totalLable.attribute.textEx = "挖方体积:";

		if (this.options.calback) this.options.calback(areastr, totalCutVolume);

		dataSource.entities.remove(entity);
		//显示立体边界
		entity = dataSource.entities.add({
			polygon: {
				hierarchy: {
					positions: positions
				},
				extrudedHeight: maxHeight,
				closeTop: false,
				closeBottom: false,
				material: new _Cesium2.default.Color.fromCssColorString("#00fff2").withAlpha(0.5),
				outline: true,
				outlineColor: new _Cesium2.default.Color.fromCssColorString("#fafa5a").withAlpha(0.4),
				outlineWidth: 1
			}
		});

		entity._totalLable = this.totalLable;
		this.totalLable = null;
	},
	computeCutVolume: function computeCutVolume(positions) {
		var minHeight = 15000;
		for (var i = 0; i < positions.length; i++) {
			var cartographic = _Cesium2.default.Cartographic.fromCartesian(positions[i]);
			var height = viewer.scene.globe.getHeight(cartographic);
			if (minHeight > height) minHeight = height;
		}

		var granularity = Math.PI / Math.pow(2, 11);
		granularity = granularity / 64;

		var polygonGeometry = new _Cesium2.default.PolygonGeometry.fromPositions({
			positions: positions,
			vertexFormat: _Cesium2.default.PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
			granularity: granularity
		});
		//polygon subdivision
		var geom = new _Cesium2.default.PolygonGeometry.createGeometry(polygonGeometry);
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

			cartesian = new _Cesium2.default.Cartesian3(geom.attributes.position.values[i0 * 3], geom.attributes.position
				.values[i0 * 3 + 1], geom.attributes.position.values[i0 * 3 + 2]);

			cartographic = _Cesium2.default.Cartographic.fromCartesian(cartesian);
			height1 = viewer.scene.globe.getHeight(cartographic);
			p1 = _Cesium2.default.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0 /*height1 + 1000*/ );

			if (maxHeight < height1) maxHeight = height1;

			cartesian = new _Cesium2.default.Cartesian3(geom.attributes.position.values[i1 * 3], geom.attributes.position
				.values[i1 * 3 + 1], geom.attributes.position.values[i1 * 3 + 2]);

			cartographic = _Cesium2.default.Cartographic.fromCartesian(cartesian);
			height2 = viewer.scene.globe.getHeight(cartographic);

			var p2 = _Cesium2.default.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0 /*height2 + 1000*/ );

			if (maxHeight < height2) maxHeight = height2;

			cartesian = new _Cesium2.default.Cartesian3(geom.attributes.position.values[i2 * 3], geom.attributes.position
				.values[i2 * 3 + 1], geom.attributes.position.values[i2 * 3 + 2]);

			cartographic = _Cesium2.default.Cartographic.fromCartesian(cartesian);
			height3 = viewer.scene.globe.getHeight(cartographic);
			p3 = _Cesium2.default.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0 /*height3 + 1000*/ );

			if (maxHeight < height3) maxHeight = height3;

			bottomArea = this.computeAreaOfTriangle(p1, p2, p3);
			totalCutVolume = totalCutVolume + bottomArea * (height1 - minHeight + height2 - minHeight + height3 -
				minHeight) / 3;
		}

		return {
			maxHeight: maxHeight,
			totalCutVolume: totalCutVolume
		};
	},
	computeAreaOfTriangle: function computeAreaOfTriangle(pos1, pos2, pos3) {
		var a = _Cesium2.default.Cartesian3.distance(pos1, pos2);
		var b = _Cesium2.default.Cartesian3.distance(pos2, pos3);
		var c = _Cesium2.default.Cartesian3.distance(pos3, pos1);
		var S = (a + b + c) / 2;
		return Math.sqrt(S * (S - a) * (S - b) * (S - c));
	},
	//求面的中心点
	computeCentroidOfPolygon: function computeCentroidOfPolygon(positions) {
		var x = [];
		var y = [];

		for (var i = 0; i < positions.length; i++) {
			var cartographic = _Cesium2.default.Cartographic.fromCartesian(positions[i]);

			x.push(cartographic.longitude);
			y.push(cartographic.latitude);
		}

		var x0 = 0.0,
			y0 = 0.0,
			x1 = 0.0,
			y1 = 0.0;
		var signedArea = 0.0;
		var a = 0.0;
		var centroidx = 0.0,
			centroidy = 0.0;

		for (i = 0; i < positions.length; i++) {
			x0 = x[i];
			y0 = y[i];

			if (i == positions.length - 1) {
				x1 = x[0];
				y1 = y[0];
			} else {
				x1 = x[i + 1];
				y1 = y[i + 1];
			}

			a = x0 * y1 - x1 * y0;
			signedArea += a;
			centroidx += (x0 + x1) * a;
			centroidy += (y0 + y1) * a;
		}

		signedArea *= 0.5;
		centroidx /= 6.0 * signedArea;
		centroidy /= 6.0 * signedArea;

		return new _Cesium2.default.Cartographic(centroidx, centroidy);
	}

};
