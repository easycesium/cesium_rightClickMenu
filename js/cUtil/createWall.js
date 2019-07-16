var CreatePolygon = function(viewer, style) {
	this.objId = Number((new Date()).getTime() + "" + Number(Math.random() * 1000).toFixed(0));
	this.viewer = viewer;
	this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.polygon = null;
	this.polyline = null;
	this.positions = [];
	this.style = style;
	this.state = 0; //1为新增 2为编辑 0为清除
}
CreatePolygon.prototype = {
	gonPointArr: [],
	startCreate: function(callBack) {
		var $this = this;
		this.handler.setInputAction(function(evt) { //单机开始绘制
			var ray = viewer.camera.getPickRay(evt.position);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			if ($this.positions.length == 0) {
				$this.positions.push(cartesian.clone());
			}
			$this.positions.push(cartesian);
			var point = $this.createPoint(cartesian);
			point.wz = $this.gonPointArr.length;
			$this.gonPointArr.push(point);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		this.handler.setInputAction(function(evt) { //移动时绘制面
			if ($this.positions.length < 1) return;
			var ray = viewer.camera.getPickRay(evt.endPosition);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			if ($this.positions.length == 2) {
				if (!Cesium.defined($this.polygon)) {
					$this.polygon = $this.createPolygon($this.style);
					$this.polygon.objId = $this.objId;
				}
			}
			if ($this.polygon) {
				$this.positions.pop();
				$this.positions.push(cartesian);
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		this.handler.setInputAction(function(evt) { 
			if (!$this.polygon) return;
			var ray = viewer.camera.getPickRay(evt.position);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			$this.state = 1;
			$this.handler.destroy();
			if ($this.floatPoint) {
				if ($this.floatPoint) $this.floatPoint.show = false;
				$this.floatPoint = null;
			}
			$this.positions.pop();
			$this.positions.push(cartesian);
			var point = $this.createPoint(cartesian);
			point.wz = $this.gonPointArr.length;
			$this.gonPointArr.push(point);
			callBack($this.polygon);
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	},
	createByPositions:function(lnglatArr,callBack){ //通过传入坐标数组创建面
		if(!lnglatArr) return ;
		var positions = cCesium.lnglatArrToCartesianArr(lnglatArr);
		if(!positions) return ;
		this.polygon = this.createPolygon(this.style);
		this.positions = positions;
		callBack(this.polygon);
		for(var i=0;i<positions.length;i++){
			var point = this.createPoint(positions[i]);
			point.wz = this.gonPointArr.length;
			this.gonPointArr.push(point);
		}
		this.state = 1;
		this.polygon.objId = this.objId;
	},
	modifyPoint: null,
	startModify: function() {
		if (this.state != 1 && this.state != 2) return; //表示还没绘制完成
		if (!this.modifyHandler) this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		var $this = this;
		for (var i = 0; i < $this.gonPointArr.length; i++) {
			var point = $this.gonPointArr[i];
			if (point) point.show = true;
		}
		this.modifyHandler.setInputAction(function(evt) {
			var pick = $this.viewer.scene.pick(evt.position);
			if (Cesium.defined(pick) && pick.id) {
				if (!pick.id.objId)
					$this.modifyPoint = pick.id;
				$this.forbidDrawWorld(true);
			} else {
				for (var i = 0; i < $this.gonPointArr.length; i++) {
					var point = $this.gonPointArr[i];
					if (point) point.show = false;
				}
				if ($this.modifyHandler) {
					$this.modifyHandler.destroy();
					$this.modifyHandler = null;
				}
			}
			//$this.state = 2;
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);
		this.modifyHandler.setInputAction(function(evt) { //移动时绘制面
			if ($this.positions.length < 1 || !$this.modifyPoint) return;
			var ray = viewer.camera.getPickRay(evt.endPosition);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			if (cartesian) {
				$this.modifyPoint.position.setValue(cartesian);
				/* $this.positions.pop();
				$this.positions.pop(); */
				$this.positions[$this.modifyPoint.wz] = cartesian;
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

		this.modifyHandler.setInputAction(function(evt) { 
			$this.forbidDrawWorld(false);
			if (!$this.modifyPoint) return;
			var ray = viewer.camera.getPickRay(evt.position);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			$this.modifyPoint.position.setValue(cartesian);
			$this.modifyPoint = null;
			$this.positions[$this.modifyPoint.wz] = cartesian;
		}, Cesium.ScreenSpaceEventType.LEFT_UP);
	},
	createPoint: function(position) {
		if (!position) return;
		return this.viewer.entities.add({
			position: position,
			point: {
				pixelSize: 5,
				color: Cesium.Color.YELLOW,
				outlineWidth: 2,
				outlineColor: Cesium.Color.DARKRED,
			},
			show: false
		});
	},
	createPolygon: function(obj) {
		var $this = this;
		return this.viewer.entities.add({
			polygon: {
				hierarchy: new Cesium.CallbackProperty(function() {
					return $this.positions
				}, false),
				clampToGround:  obj.clampToGround || true ,
				show: true,
				fill: obj.fill || true ,
				material: obj.material || Cesium.Color.WHITE,
				width: obj.width || 3,
				outlineColor: obj.outlineColor || Cesium.Color.BLACK,
				outlineWidth: obj.outlineWidth || 1,
				outline : false || obj.outline

			}

		});
	},
	createPolyline: function() {
		return this.viewer.entities.add({
			polyline: {
				positions: new Cesium.CallbackProperty(function() {
					return $this.positions
				}, false),
				clampToGround: true || obj.clampToGround,
				show: true,
				fill: true || obj.fill,
				material: Cesium.Color.WHITE || obj.material,
				width: 3 || obj.width
			}
		});
	},
	getPositions: function() {
		return this.positions;
	},
	setStyle: function(obj) {},
	remove: function() {
		if (this.polygon) {
			this.state = 0;
			this.viewer.entities.remove(this.polygon);
			this.polygon = null;
		}
	},
	setVisible: function(vis) {
		this.polygon.show = vis;
	},
	forbidDrawWorld: function(isForbid) {
		this.viewer.scene.screenSpaceCameraController.enableRotate = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableTilt = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableTranslate = !isForbid;
		this.viewer.scene.screenSpaceCameraController.enableInputs = !isForbid;
	}
}
