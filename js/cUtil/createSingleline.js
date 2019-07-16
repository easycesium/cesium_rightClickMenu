var CreateSingleline = function(viewer, style) {
	this.objId = Number((new Date()).getTime() + "" + Number(Math.random() * 1000).toFixed(0)); 
	this.viewer = viewer;
	this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
	this.polyline = null;
	this.positions = [];
	this.floatPoint = null;
	this.linePointArr = [];
	this.style = style;
	this.state = 0; //1为新增 2为编辑 0为清除
}
CreateSingleline.prototype = {
	
	startCreate: function(callBack) {
		var $this = this;
		this.handler.setInputAction(function(evt) { //单机开始绘制
			var ray = viewer.camera.getPickRay(evt.position);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			$this.positions.push(cartesian);
			var point = $this.createPoint(cartesian);
			if($this.positions.length == 1){
				$this.floatPoint = $this.createPoint(cartesian.clone());
				$this.positions.push(cartesian.clone());
				point.wz = 1;
			}
			if($this.positions.length >1 && $this.polyline){
				point.wz = 2;
				if($this.floatPoint) $this.floatPoint.show = false;
				$this.floatPoint = null;
				$this.positions.pop();
				callBack($this.polyline);
				$this.state = 1;
				$this.handler.destroy();
			}
			$this.linePointArr.push(point);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		this.handler.setInputAction(function(evt) { //移动时绘制面
			if ($this.positions.length < 1) return;
			var ray = viewer.camera.getPickRay(evt.endPosition);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			if($this.floatPoint) $this.floatPoint.position.setValue(cartesian);
			if ($this.positions.length == 2) {
				if (!Cesium.defined($this.polyline)) {
					$this.polyline = $this.createPolyline($this.style);
					$this.polyline.objId = $this.objId;
				}
			} 
			if ($this.polyline) {
				$this.positions.pop();
				$this.positions.push(cartesian);
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	},
	modifyPoint : null,
	startModify: function() {
		if(this.state!=2) return ; //表示还没绘制完成
		if(!this.modifyHandler) this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas); 
		var $this = this;
		for(var i=0;i<$this.linePointArr.length;i++){
			var point = $this.linePointArr[i];
			if(point) point.show = true;
		}
		
		this.modifyHandler.setInputAction(function(evt) { 
			var pick = $this.viewer.scene.pick(evt.position);
			if (Cesium.defined(pick) && pick.id){
				if(!pick.id.objId)
					$this.modifyPoint = pick.id;
				$this.forbidDrawWorld(true);	
			}else{
				for(var i=0;i<$this.linePointArr.length;i++){
					var point = $this.linePointArr[i];
					if(point) point.show = false;
				}
				if($this.modifyHandler){
					$this.modifyHandler.destroy();
					$this.modifyHandler = null;
				} 
			}
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);
		this.modifyHandler.setInputAction(function(evt) { //移动时绘制面
			if ($this.positions.length < 1 || !$this.modifyPoint) return;
			var ray = viewer.camera.getPickRay(evt.endPosition);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			if(cartesian){
				$this.modifyPoint.position.setValue(cartesian);
				$this.positions[$this.modifyPoint.wz] = cartesian;
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		
		this.modifyHandler.setInputAction(function(evt) { //移动时绘制面
			if(!$this.modifyPoint) return;
			var ray = viewer.camera.getPickRay(evt.position);
			if (!ray) return;
			var cartesian = viewer.scene.globe.pick(ray, $this.viewer.scene);
			$this.modifyPoint.position.setValue(cartesian);
			$this.modifyPoint = null;
			$this.positions[$this.modifyPoint.wz] = cartesian;
			$this.forbidDrawWorld(false);
		}, Cesium.ScreenSpaceEventType.LEFT_UP);
	},
	createPoint: function(position) {
		if (!position) return;
		return this.viewer.entities.add({
			position: position,
			point: {
				pixelSize:5,
				color:Cesium.Color.YELLOW,
				outlineWidth:2,
				outlineColor:Cesium.Color.DARKRED,
			},
			show : false
		});
	},
	createPolyline: function(obj) {
		var $this = this;
		return this.viewer.entities.add({
			polyline: {
				positions: new Cesium.CallbackProperty(function() {
					return $this.positions
				}, false),
				clampToGround: obj.clampToGround,
				depthFailMaterial:Cesium.Color.RED,
				show: true,
				fill: obj.fill || true ,
				material:  obj.material || Cesium.Color.WHITE,
				width: obj.width || 3
			}
		});
	},
	getPositions: function() {
		return this.positions;
	},
	setStyle: function(obj) {},
	remove: function() {
		if (this.polyline) {
			this.state = 0;
			this.viewer.entities.remove(this.polyline);
			this.polyline = null;
		}
	},
	setVisible: function(vis) {
		this.polyline.show = vis;
	},
	forbidDrawWorld:function(isForbid){
		this.viewer.scene.screenSpaceCameraController.enableRotate = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableTilt = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = !isForbid;
        this.viewer.scene.screenSpaceCameraController.enableInputs = !isForbid;
	}
}


