var entityDMBJ = null;
var minimumHeights = [];
var polygonPoints = [];
function showClippingPlanes(points) {
	var newArr = [];
	var clippingPlanes = [];
	var pointsLength = points.length;
	var cartesian3 = new Cesium.Cartesian3();
	var direction = Cesium.Cartesian3.subtract(points[0], points[1], cartesian3); 
	direction = direction.x > 0; 
	for (var i = 0; i < pointsLength; ++i) {
		var nextIndex = (i + 1) % pointsLength;
		var midpoint = Cesium.Cartesian3.midpoint(points[i], points[nextIndex], new Cesium.Cartesian3());
		newArr.push(points[i]);
		newArr.push(midpoint);
		var up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());
		var right;
		if (direction) { 
			right = Cesium.Cartesian3.subtract(points[i], midpoint, new Cesium.Cartesian3());
		} else {
			right = Cesium.Cartesian3.subtract(points[nextIndex], midpoint, new Cesium.Cartesian3());
		}
		right = Cesium.Cartesian3.normalize(right, right);
		var normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
		normal = Cesium.Cartesian3.normalize(normal, normal);
		var originCenteredPlane = new Cesium.Plane(normal, 0.0);
		var distance = Cesium.Plane.getPointDistance(originCenteredPlane, midpoint);
		clippingPlanes.push(new Cesium.ClippingPlane(normal, distance));
	}
	viewer.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
		planes: clippingPlanes,
		edgeWidth: 1.0,
		edgeColor: Cesium.Color.WHITE,
		enabled: true
	});
	//addClippingImageMaterial(newArr);
}
function addClippingImageMaterial(points) {
	viewer.scene.globe.depthTestAgainstTerrain = true; 
	var wallHeight = $("#clipHeight").val() || 30; 
	var maximumHeights = [];
	var wallPoints = [];
	polygonPoints = [];
	for (var i = 0; i < points.length; ++i) {
		var carto = Cesium.Cartographic.fromCartesian(points[i]);
		var _height = carto.height;
		var _heightNew = viewer.scene.sampleHeight(carto);
		if (_height != null && _heightNew > _height)
			_height = _heightNew;
		minimumHeights.push(_height - wallHeight);
		maximumHeights.push(_height);
		wallPoints.push(Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, 0));
		polygonPoints.push(Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, _height -
			wallHeight));
	}
	wallPoints.push(wallPoints[0]);
	minimumHeights.push(minimumHeights[0]);
	maximumHeights.push(maximumHeights[0]);
	entityDMBJ = viewer.entities.add({
		name: '挖地四周墙',
		wall: {
			positions: wallPoints,
			maximumHeights: maximumHeights,
			minimumHeights: new Cesium.CallbackProperty(function() {
				return minimumHeights;
			}, false),
			material: new Cesium.ImageMaterialProperty({
				image: '../img/excavationregion_top.jpg',
				repeat: new Cesium.Cartesian2(10, wallHeight)
			}),
		}
	});
	var entityDM = viewer.entities.add({
		name: '挖地底面',
		polygon: {
			hierarchy: new Cesium.CallbackProperty(function() {
				return polygonPoints;
			}, false),
			perPositionHeight: true,
			material: new Cesium.ImageMaterialProperty({
				image: '../img/excavationregion_side.jpg',
				repeat: new Cesium.Cartesian2(10, 10)
			}),
		}
	});
	arrEntity = [entityDMBJ, entityDM];
	viewer.scene.globe.depthTestAgainstTerrain = false;
}
