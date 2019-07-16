var TS = {
	showpanel: function() {
		$("#TS_panel").show();
		this.activate();
	},
	aimHandler: null,
	viewHandler: null,
	isActivate: false,
	activate: function() {
		if (!this.isActivate) {
			this.isActivate = !this.isActivate;
			this.aimHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
			this.viewHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
		}
	},
	disable: function() {
		if (this.isActivate) {
			this.isActivate = false;
			if (this.viewHandler) {
				this.viewHandler.destroy();
				this.viewHandler = null;
			}
			if (this.aimHandler) {
				this.viewHandler.destroy();
				this.viewHandler = null;
			}

			this.clear();
		}
	},
	clear: function() {
		if (this.viewPoint) {
			viewer.entities.remove(this.viewPoint);
			this.viewPoint = null;
		}
		if (this.viewLabel) {
			viewer.entities.remove(this.viewLabel);
			this.viewLabel = null;
		}

		for (var i = 0; i < this.aimPointArr.length; i++) {
			var aimP = this.aimPointArr[i];
			var aimL = this.aimLabelArr[i];
			if (aimP) {
				viewer.entities.remove(aimP);
			}
			if (aimL) {
				viewer.entities.remove(aimL);
			}
		}
		this.aimPointArr = [];
		this.aimLabelArr = [];
		for (var i = 0; i < this.entitieArr.length; i++) {
			viewer.entities.remove(this.entitieArr[i]);
		}
		this.entitieArr = [];
	},
	viewPoint: null,
	viewLabel: null,
	createViewPoint: function() {
		var $this = this;
		if (this.viewHandler) {
			this.viewHandler.setInputAction(function(evt) { //单机开始绘制
				var pick = viewer.scene.pick(evt.position);
				var cartesian = null;
				if (viewer.scene.pickPositionSupported && Cesium.defined(pick)) { //表示选中的是模型上某点
					cartesian = viewer.scene.pickPosition(evt.position);
				} else { //选中的是地形上的某点
					var ray = viewer.camera.getPickRay(evt.position);
					if (!ray) return;
					cartesian = viewer.scene.globe.pick(ray, viewer.scene);
				}
				var lnglat = cCesium.cartesianToLnglat(cartesian);
				var newCart = cCesium.lnglatToCartesian(lnglat[0], lnglat[1], lnglat[2] + 3);
				$this.viewPoint = $this.createPoint(cartesian);
				$this.viewLabel = $this.createLabel(cartesian, "观测点");
				$this.viewHandler.destroy();
				$this.viewHandler = null;
			}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		}
	},

	aimPointArr: [],
	aimLabelArr: [],
	createAimPoint: function() {
		var $this = this;
		if (!this.viewPoint) return;
		if (!this.aimHandler) {
			this.aimHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
		}
		$this.aimHandler.setInputAction(function(evt) {
			var pick = viewer.scene.pick(evt.position);
			var cartesian = null;
			if (viewer.scene.pickPositionSupported && Cesium.defined(pick)) { //表示选中的是模型上某点
				cartesian = viewer.scene.pickPosition(evt.position);
			} else { //选中的是地形上的某点
				var ray = viewer.camera.getPickRay(evt.position);
				if (!ray) return;
				cartesian = viewer.scene.globe.pick(ray, viewer.scene);
			}
			var aimLabel = $this.createLabel(cartesian, "目标点");
			var aimPoint = $this.createPoint(cartesian);
			$this.showLine($this.viewPoint, aimPoint);
			$this.aimPointArr.push(aimPoint);
			$this.aimLabelArr.push(aimLabel);
			$this.aimHandler.destroy();
			$this.aimHandler = null;
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

	},
	entitieArr: [],
	showLine: function(p1, p2) {
		viewer.render();
		viewer.scene.render();
		if (!p1 || !p2) return;
		var drillPick = true;
		var pointsArr = [p1, p2];
		var start = p1.position.getValue();
		var end = p2.position.getValue();
		var objArr = pointsArr;
		var direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(end, start, new Cesium.Cartesian3()),
			new Cesium
			.Cartesian3());
		var ray = new Cesium.Ray(start, direction);
		var results = [];
		if (drillPick) {
			results = viewer.scene.drillPickFromRay(ray, 10, objArr);
		} else {
			var result = viewer.scene.pickFromRay(ray, objArr);
			if (Cesium.defined(result)) {
				results = [result];
			}
		}
		if (results.length != 0) {
			if (!results[0].position) results[0].position = start;
			var blueLine = viewer.entities.add({
				polyline: {
					show: true,
					positions: [start, results[0].position],
					material: Cesium.Color.BLUE,
					width: 3,
					//clampToGround: true
				}
			});
			var redLine = viewer.entities.add({
				polyline: {
					show: true,
					positions: [results[0].position, end],
					material: Cesium.Color.RED,
					width: 3,
					//clampToGround: true
				}
			});
			this.entitieArr.push(blueLine);
			this.entitieArr.push(redLine);
		} else {
			var redLine = viewer.entities.add({
				polyline: {
					show: true,
					positions: [start, end],
					material: Cesium.Color.RED,
					width: 3,
					//clampToGround: true
				}
			});
			this.entitieArr.push(redLine);
		}
	},
	createPoint: function(cartesian) {
		if (!cartesian) return null;
		var point = viewer.entities.add({
			position: cartesian,
			ellipsoid: {
				radii: new Cesium.Cartesian3(10, 10, 10),
				show: false,
				//heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
			}
		});
		return point;
	},
	createLabel: function(cartesian, text) {
		if (!cartesian) return null;
		var label = viewer.entities.add({
			position: cartesian,
			label: {
				text: text || "",
				disableDepthTestDistance: Number.POSITIVE_INFINITY
			}
		});
		return label;
	},
	bindHandler: function() {
		var $this = this;
		$("#addViewPoint").click(function() {
			$this.createViewPoint();
		});
		$("#addAimPoint").click(function() {
			$this.createAimPoint();
		});
		$("#clear").click(function() {
			$this.clear();
		});
	}
}
