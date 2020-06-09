//在开始定义场景编码之前，定义一个调色板是很有用的

var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0
}


////////////////////////////////////////定义基本变量//////////////////////////////////

var scene; //一个threejs一个场景

var camera;
var fieldOfView; //FOV
var aspectRatio; //长宽比
var nearPlane; //近裁剪面
var farPlane;

var height = window.innerHeight;
var width = window.innerWidth;

var renderer;

var container;

////////////////////////////////////////场景基础//////////////////////////////////


function createScene() {

    scene = new THREE.Scene();

    //雾的颜色和背景一样
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    aspectRatio = width / height;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;

    camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 100;

    renderer = new THREE.WebGLRenderer({
        //背景是透明的
        alpha: true,
        //抗锯齿
        antialias: true
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', handleWindowResize, false);

}

//窗口大小变动事件
function handleWindowResize() {

    height = window.innerHeight;
    width = window.innerWidth;

    renderer.setSize(width, height);

    camera.aspect = width / height;

    camera.updateProjectionMatrix();



}

////////////////////////////////////////光照基础//////////////////////////////////

var hemisphereLight, shadowLight;

function createLights() {

    //渐变光
    //第一个参数是天空的颜色，第二个是地面的颜色，第三个是光源的强度
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

    //平行光，第一个参数是光线颜色，第二个是光线强度
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    shadowLight.position.set(150, 350, 350);

    //有影子
    shadowLight.castShadow = true;

    //阴影范围
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    //阴影分辨率
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    //加入场景
    scene.add(hemisphereLight);
    scene.add(shadowLight);

}

////////////////////////////////////////画一片大海//////////////////////////////////


//首先定义一个大海对象
Sea = function(){

    // 创建一个圆柱几何体
    // 参数为：顶面半径，底面半径，高度，半径分段，高度分段
    var geom = new THREE.CylinderGeometry(600,600,800,40,10);
 
    // 在 x 轴旋转几何体
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
 
    // 创建材质
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.blue,
        transparent:true,
        opacity:.6,
        shading:THREE.FlatShading,
    });
 
    // 为了在 Three.js 创建一个物体，我们必须创建网格用来组合几何体和一些材质 
    this.mesh = new THREE.Mesh(geom, mat);
 
    // 允许大海对象接收阴影
    this.mesh.receiveShadow = true; 
 }
 
 //实例化大海对象，并添加至场景
 var sea;
 
 function createSea(){
    sea = new Sea();
 
    // 在场景底部，稍微推挤一下
    sea.mesh.position.y = -600;
 
    // 添加大海的网格至场景
    scene.add(sea.mesh);
 }




//初始化
window.onload = function () {

    //同所有游戏引擎的场景
    createScene();
    createLights();
    createSea();
    //游戏的主角
    //createPlane();

    

    //createSky();
    //每帧调用
    loop();

}

function loop(){

    //每帧调用
    renderer.render(scene,camera);

    requestAnimationFrame(loop);
}