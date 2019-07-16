var DrawTool = function(obj) {
	this.viewer = obj.viewer;
	this.hasEdit = obj.hasEdit;
	this.toolArr = [];
	this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
}
DrawTool.prototype = {
	startDraw: function(opt) {
		if (this.hasEdit) {
			this.bindEdit();
		}
		if (opt.type == "polyline") {
			var polyline = new CreatePolyline(this.viewer, opt.style);
			polyline.startCreate(opt.success); //绘制完成之后的回调
			this.toolArr.push(polyline);
		}
		if (opt.type == "polygon") {
			var polygon = new CreatePolygon(this.viewer, opt.style);
			polygon.startCreate(opt.success); //绘制完成之后的回调
			this.toolArr.push(polygon);
		}
		if (opt.type == "singleline") {
			var singleline = new CreateSingleline(this.viewer, opt.style);
			singleline.startCreate(opt.success); //绘制完成之后的回调
			this.toolArr.push(singleline);
		}
		if (opt.type == "point") {
			
		}
	},
	drawByPositions:function(opt){
		if (this.hasEdit) {
			this.bindEdit();
		}
		if(!opt) opt = {};
		if (opt.type == "polyline") {
			var polyline = new CreatePolyline(this.viewer, opt.style);
			polyline.createByPositions(opt.positions,opt.success); 
			this.toolArr.push(polyline);
		}
		if (opt.type == "polygon") {
			var polygon = new CreatePolygon(this.viewer, opt.style);
			polygon.createByPositions(opt.positions,opt.success); 
			this.toolArr.push(polygon);
		}
		if (opt.type == "point") {
			
		}
	},
	destroy:function(){
		for(var i=0;i<this.toolArr.length;i++){
			var obj = this.toolArr[i];
			obj.destroy();
		}
	},
	lastSelectEntity: null,
	bindEdit: function() {
		var $this = this;
		this.handler.setInputAction(function(evt) { //单机开始绘制
			var pick = $this.viewer.scene.pick(evt.position);
			if (Cesium.defined(pick) && pick.id) {
				for (var i = 0; i < $this.toolArr.length; i++) {
					if (pick.id.objId == $this.toolArr[i].objId) {
						$this.lastSelectEntity = $this.toolArr[i];
						$this.toolArr[i].startModify();
						break;
					}
				}
			}
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	}
}
