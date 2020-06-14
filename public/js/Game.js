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

var game;


////////////////////////////////////////游戏基本设置//////////////////////////////////


function resetGame() {
    game = {
        speed: 0.01,

        status: 'welcome'


    }
}

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


//一个大海对象
Sea = function () {

    // 参数为：顶面半径，底面半径，高度，半径分段，高度分段
    //分段越多看起来越光滑
    var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    // 在 x 轴旋转几何体
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    // 创建材质
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.blue,
        transparent: true,
        opacity: .6,
        shading: THREE.FlatShading,
    });

    // 使用几何体和材质初始化mesh
    this.mesh = new THREE.Mesh(geom, mat);

    //接收阴影
    this.mesh.receiveShadow = true;
}

var sea;

function createSea() {
    sea = new Sea();

    // 在场景底部
    sea.mesh.position.y = -600;

    // 将mesh加入
    scene.add(sea.mesh);
}

////////////////////////////////////////画一些云，并把它们添加到天空里//////////////////////////////////

Cloud = function () {

    this.mesh = new THREE.Object3D();

    //长宽高
    var geom = new THREE.BoxGeometry(20, 20, 20);

    var mat = new THREE.MeshPhongMaterial({
        color: Colors.white,
        transparent: true,
        opacity: .8
    });

    //一朵云由几个方块组成，这里设置为3-5块
    var nBlocks = 3 + Math.floor(Math.random() * 3);

    for (var i = 0; i < nBlocks; i++) {

        var m = new THREE.Mesh(geom, mat);

        m.position.x = i * 15; //横向偏移，棱长20的正方体取15
        m.position.y = Math.random() * 10; //纵向偏移0-10
        m.position.z = Math.random() * 10;

        m.rotation.z = Math.random() * Math.PI * 2; //z轴（屏幕来看是顺逆时针）旋转0-2pi
        m.rotation.y = Math.random() * Math.PI * 2;; //y轴，内外翻转

        var s = 0.1 + Math.random() * 0.9;
        //缩放
        m.scale.set(s, s, s);

        //自己是否投影和是否接受别人的投影
        m.castShadow = true;
        m.receiveShadow = true;

        this.mesh.add(m);

    }


}

Sky = function () {

    this.mesh = new THREE.Object3D();

    //画15-20片云
    this.nClouds = 15 + Math.floor(Math.random() * 5);

    //我们的飞机其实是绕着圈飞的
    //所以云也是绕着圈长的
    var stepAngle = Math.PI * 2 / this.nClouds;

    for (var i = 0; i < this.nClouds; i++) {

        var cloud = new Cloud();

        var a = stepAngle * i;
        var r = 750 + Math.random() * 200; //圆柱的半径是600

        cloud.mesh.position.y = Math.sin(a) * r;
        cloud.mesh.position.x = Math.cos(a) * r;
        cloud.mesh.position.z = -400 - Math.random() * 400; //(-400,-800)，深度也随机

        cloud.mesh.rotation.z = a + Math.PI / 2;

        var s = 1 + Math.random() * 2;
        cloud.mesh.scale.set(s, s, s);

        this.mesh.add(cloud.mesh);
    }

}

var sky;

function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}

////////////////////////////////////////画一架飞机//////////////////////////////////


var Plane = function () {

    this.mesh = new THREE.Object3D();

    //机身
    var bodyGeom = new THREE.BoxGeometry(60, 50, 50);

    bodyGeom.vertices[4].y -= 10;
    bodyGeom.vertices[4].z += 20;
    bodyGeom.vertices[5].y -= 10;
    bodyGeom.vertices[5].z -= 20;
    bodyGeom.vertices[6].y += 10;
    bodyGeom.vertices[6].z += 20;
    bodyGeom.vertices[7].y += 10;
    bodyGeom.vertices[7].z -= 20;

    var bodyMat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);

    //引擎
    var engineGeom = new THREE.BoxGeometry(20, 50, 50);
    var engineMat = new THREE.MeshPhongMaterial({
        color: Colors.white,
        shading: THREE.FlatShading
    });
    var engine = new THREE.Mesh(engineGeom, engineMat);
    engine.position.x = 40; //30/2 + 20/2
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    //机尾
    var tailGeom = new THREE.BoxGeometry(15, 20, 5);
    var tailMat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var tail = new THREE.Mesh(tailGeom, tailMat);
    tail.position.set(-35, 25, 0);
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.mesh.add(tail);

    //机翼
    var wingGeom = new THREE.BoxGeometry(40, 8, 150);
    var wingMat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var wing = new THREE.Mesh(wingGeom, wingMat);
    wing.castShadow = true;
    wing.receiveShadow = true;
    this.mesh.add(wing);

    //螺旋桨
    var propellerGeom = new THREE.BoxGeometry(20, 10, 10);

    propellerGeom.vertices[4].y -= 5;
    propellerGeom.vertices[4].z += 5;
    propellerGeom.vertices[5].y -= 5;
    propellerGeom.vertices[5].z -= 5;
    propellerGeom.vertices[6].y += 5;
    propellerGeom.vertices[6].z += 5;
    propellerGeom.vertices[7].y += 5;
    propellerGeom.vertices[7].z -= 5;

    var propellerMat = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    this.propeller = new THREE.Mesh(propellerGeom, propellerMat);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    //螺旋桨叶
    var bladeGeom = new THREE.BoxGeometry(1, 80, 10);
    var bladeMat = new THREE.MeshPhongMaterial({
        color: Colors.browndark,
        shading: THREE.FlatShading
    });
    var blade = new THREE.Mesh(bladeGeom, bladeMat);
    blade.position.x = 8;
    blade.castShadow = true;
    blade.receiveShadow = true;

    var blade2 = blade.clone();
    blade2.rotation.x = Math.PI / 2;
    blade2.castShadow = true;
    blade2.receiveShadow = true;


    this.propeller.add(blade);
    this.propeller.add(blade2);
    this.propeller.position.x = 50;
    this.mesh.add(this.propeller);
}


var plane = new Plane();

function createPlane() {

    plane = new Plane();

    plane.mesh.scale.set(0.25, 0.25, 0.25);
    plane.mesh.position.y = 100;
    scene.add(plane.mesh);

}
////////////////////////////////////////来点音乐//////////////////////////////////


function initBgm() {
    //进度条的left从百分之三十到百分之七十
    var cursor = document.getElementById("cursor");
    var bgm = document.getElementById("bgm");
    var duration = bgm.duration;


    var wave = document.getElementById('wave');
    var context = wave.getContext('2d');



    var waveWidth = wave.width;
    var waveHeight = wave.height;

    var AudCtx = new AudioContext();
    var src = AudCtx.createMediaElementSource(bgm);
    var analyser = AudCtx.createAnalyser();

    src.connect(analyser);
    analyser.connect(AudCtx.destination);
    analyser.fftSize = 128;

    var bufferLength = analyser.frequencyBinCount;

    var barWidth = (waveWidth / bufferLength) - 2;
    var barHeight;

    var dataArray = new Uint8Array(bufferLength);

    function renderWave(){

        requestAnimationFrame(renderWave);

        var currentTime = bgm.currentTime;
        var percentLeft = normalize(currentTime,0,duration,30,70);

        cursor.style.left = percentLeft + '%';

        context.fillStyle = '#e4e0ba';
        context.fillRect(0, 0, waveWidth,waveHeight);//画布拓展全屏,动态调整

        analyser.getByteFrequencyData(dataArray);

        var curPos = 0;

        for(var i = 0; i < bufferLength;i++){
            var data = dataArray[i];

            var percentV = data / 255;//纵向比例
            var percentH = i / bufferLength;//横向比例

             barHeight = waveHeight * percentV;

             context.fillStyle = "white";
             context.fillRect(curPos, waveHeight - barHeight, barWidth, barHeight);

             curPos += barWidth + 2;
        }
    }

    renderWave();

    bgm.play();
}

////////////////////////////////////////游戏逻辑//////////////////////////////////

var mousePos = {
    x: 0,
    y: 0
}

function handleMouseMove(event) {

    var tx = -1 + (event.clientX / width) * 2;

    var ty = 1 - (event.clientY / height) * 2;
    mousePos = {
        x: tx,
        y: ty
    };

}

function updatePlane() {

    var targetY = normalize(mousePos.y, -.75, .75, 25, 175);
    var targetX = normalize(mousePos.x, -.75, .75, -100, 100);

    // 在每帧通过添加剩余距离的一小部分的值移动飞机
    plane.mesh.position.y += (targetY - plane.mesh.position.y) * 0.1;

    // 剩余的距离按比例转动飞机
    plane.mesh.rotation.z = (targetY - plane.mesh.position.y) * 0.0128;
    plane.mesh.rotation.x = (plane.mesh.position.y - targetY) * 0.0064;

    plane.propeller.rotation.x += 0.3;

}

////////////////////////////////////////初始化//////////////////////////////////

window.onload = function () {

    resetGame();

    createScene();
    createLights();
    createSea();
    //游戏的主角
    createPlane();

    createSky();

    renderer.render(scene, camera);

    //document.addEventListener('mousemove',handleMouseMove,false);
    //loop();

    //等待游戏初始化
    document.getElementById('start-button').addEventListener('click', initGame);


}




function initGame() {

    //删去加载界面
    document.getElementById('world').style.filter = 'none';

    document.getElementById('pre-title').style.opacity = 0;
    document.getElementById('pre-desc').style.opacity = 0;
    document.getElementById('pre-intro').style.opacity = 0;
    document.getElementById('start-button').style.opacity = 0;
    document.getElementById('pre-bottom').style.opacity = 0;

    setTimeout(function () {
        document.getElementById('loader').style.display = 'none';
    }, 2000);


    //加载监视函数
    document.addEventListener('mousemove', handleMouseMove, false);


    initBgm();

    loop();

}



function loop() {

    //每帧调用
    renderer.render(scene, camera);

    //转起来
    sky.mesh.rotation.z += game.speed;
    sea.mesh.rotation.z += game.speed / 2;

    //更新飞机位置和螺旋桨　
    updatePlane();

    requestAnimationFrame(loop);
}