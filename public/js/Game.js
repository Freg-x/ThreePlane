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
        speed: 0, //场景旋转速度

        status: 'welcome',

        minHeight: 25,
        maxHeight: 175,
        minFront: -50,
        maxFront: 50,

        collisionSpeedX: 0,
        collisionSpeedY: 0,
        collisionPosX: 0,
        collisionPosY: 0,

        curBeats: 0,
        curPoint: 0,

        coinLength: 5,

        coinSpawnInterv: 1800, //每隔多少秒生成coin

        bpm: 600, //毫秒

        stage: 1,

        currentTime: 0


    }
}

//变速
function updateBeat() {
    if (game.currentTime < 32) {

        //1阶段，1倍速
        if (game.speed < 0.015) game.speed += 0.0001;
        game.stage = 1;

    } else if (game.currentTime >= 32 && game.currentTime <= 51) {

        //2阶段,2倍速
        if (game.speed < 0.03) game.speed += 0.0001;
        game.coinSpawnInterv = 900;
        game.stage = 2;

    } else if (game.currentTime > 51 && game.currentTime <= 70) {

        //3阶段,1.5倍速
        if (game.speed > 0.02) game.speed -= 0.0001;
        game.coinSpawnInterv = 1800;
        game.stage = 3;


    } else if (game.currentTime > 70 && game.currentTime <= 99) {

        //4阶段,1倍速
        if (game.speed > 0.015) game.speed -= 0.0001;
        game.stage = 4;



    } else if (game.currentTime > 99 && game.currentTime <= 138) {

        //5阶段,2.5倍速
        if (game.speed < 0.03) game.speed += 0.0001;
        game.stage = 5;


    } else {

        //6阶段,1倍速
        if (game.speed > 0) game.speed -= 0.0001;

        if (game.minHeight < 100) game.minHeight += 0.4;
        if (game.maxHeight > 100) game.maxHeight -= 0.4;

        if (game.minFront < width && game.minFront < game.maxFront) game.minFront += 0.8;
        if (game.maxFront < width) game.maxFront += 0.5;

        game.stage = 6;


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
    geom.mergeVertices(); //不合并几何体会裂开

    var length = geom.vertices.length;

    this.waves = []; //字典数组，下标代表点的编号

    for (var i = 0; i < length; i++) {

        var v = geom.vertices[i];

        this.waves.push({
            x: v.x,
            y: v.y,
            z: v.z,
            ang: Math.random() * Math.PI * 2, //随机转一个角度
            amp: 5 + Math.random() * 15,
            speed: game.speed + Math.random() * game.speed * 2
        });
    }

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

Sea.prototype.updateWaves = function () {

    var verts = this.mesh.geometry.vertices;
    var l = verts.length;

    for (var i = 0; i < l; i++) {

        var v = verts[i];

        var vWave = this.waves[i];

        v.x = vWave.x + Math.cos(vWave.ang) * vWave.amp;
        v.y = vWave.y + Math.sin(vWave.ang) * vWave.amp;

        vWave.ang += vWave.speed;
    }

    this.mesh.geometry.verticesNeedUpdate = true; //防止渲染器忽略

    sea.mesh.rotation.z += game.speed / 2;
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


var Pilot = function () {

    this.mesh = new THREE.Object3D();
    this.mesh.name = 'pilot';
    this.angleHairs = 0;
    this.angleHead = 0; //头绕z轴旋转

    //身体
    var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
    var bodyMat = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);

    this.mesh.add(body);

    //脸
    var faceGeom = new THREE.BoxGeometry(10, 10, 10);
    var faceMat = new THREE.MeshLambertMaterial({
        color: Colors.pink
    });
    var face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);

    //头发
    var hairGeom = new THREE.BoxGeometry(4, 4, 4);
    var hairMat = new THREE.MeshLambertMaterial({
        color: Colors.brown
    });
    var hair = new THREE.Mesh(hairGeom, hairMat);
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));

    var hairs = new THREE.Object3D();
    this.hairsTop = new THREE.Object3D();

    //3x4的平板
    for (var i = 0; i < 12; i++) {
        var h = hair.clone();
        var col = i % 3;
        var row = Math.floor(i / 3);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
        h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 1, 1));
        this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    //侧边和后面的头发

    var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
    var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    var hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2, -6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);

    var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0)
    hairs.add(hairBack);
    hairs.position.set(-5, 5, 0);

    this.mesh.add(hairs);

    //眼镜和耳朵

    var glassGeom = new THREE.BoxGeometry(5, 5, 5);
    var glassMat = new THREE.MeshLambertMaterial({
        color: Colors.brown
    });
    var glassR = new THREE.Mesh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);
    var glassL = glassR.clone();
    glassL.position.z = -glassR.position.z

    var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    var glassA = new THREE.Mesh(glassAGeom, glassMat);
    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);

    var earGeom = new THREE.BoxGeometry(2, 3, 2);
    var earL = new THREE.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);
    var earR = earL.clone();
    earR.position.set(0, 0, 6);
    this.mesh.add(earL);
    this.mesh.add(earR);

}

Pilot.prototype.updatePilot = function () {

    var hairs = this.hairsTop.children;

    var l = hairs.length;
    for (var i = 0; i < l; i++) {
        var h = hairs[i];
        h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
    }
    this.angleHairs += game.speed * 40;

    if (game.currentTime * 1000 >= game.bpm) {

        var beat = Math.floor(game.currentTime * 1000) % game.bpm;

        if (beat <= 200) {
            this.mesh.rotation.z -= 0.02;
        } else if (beat <= 400) {
            this.mesh.rotation.z += 0.02;
        }

        if (this.mesh.rotation.z >= 0.4) this.mesh.rotation.z = 0.4;
        if (this.mesh.rotation.z <= -0.4) this.mesh.rotation.z = -0.4;

    }


}

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

    this.pilot = new Pilot();
    this.pilot.mesh.position.set(-5, 28, 0);
    this.mesh.add(this.pilot.mesh);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
}


var plane;

function createPlane() {

    plane = new Plane();

    plane.mesh.scale.set(0.25, 0.25, 0.25);
    plane.mesh.position.y = 100;
    scene.add(plane.mesh);

}
////////////////////////////////////////来点粒子//////////////////////////////////


Particle = function () {

    var geom = new THREE.TetrahedronGeometry(3, 0);
    var mat = new THREE.MeshPhongMaterial({
        color: 0x009999,
        shininess: 0,
        specular: 0xffffff,
        shading: THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom, mat);

}

Particle.prototype.explode = function (pos, color, scale) {

    var _this = this;
    var _p = this.mesh.parent;
    this.mesh.material.color = new THREE.Color(color);
    this.mesh.material.needsUpdate = true;
    this.mesh.scale.set(scale, scale, scale);
    var targetX = pos.x + (-1 + Math.random() * 2) * 50; //扩散效果
    var targetY = pos.y + (-1 + Math.random() * 2) * 50;
    var speed = .6 + Math.random() * .2;

    TweenMax.to(this.mesh.rotation, speed, {
        x: Math.random() * 12,
        y: Math.random() * 12
    });
    TweenMax.to(this.mesh.scale, speed, {
        x: .1,
        y: .1,
        z: .1
    });
    TweenMax.to(this.mesh.position, speed, {
        x: targetX,
        y: targetY,
        delay: Math.random() * .1,
        ease: Power2.easeOut,
        onComplete: function () {
            if (_p) _p.remove(_this.mesh); //删掉它
            _this.mesh.scale.set(1, 1, 1);
        }
    });
}

ParticlesHolder = function () {
    this.mesh = new THREE.Object3D();
}

ParticlesHolder.prototype.spawnParticles = function (pos, density, color, scale) {

    var nPArticles = density;
    for (var i = 0; i < nPArticles; i++) {

        var particle = new Particle();

        this.mesh.add(particle.mesh);
        particle.mesh.visible = true;
        particle.mesh.position.y = pos.y;
        particle.mesh.position.x = pos.x;
        particle.explode(pos, color, scale);
    }

}

var particlesHolder;

function createParticlesHolder() {
    particlesHolder = new ParticlesHolder();
    scene.add(particlesHolder.mesh);
}

////////////////////////////////////////来点硬币//////////////////////////////////


Coin = function () {

    var geom = new THREE.TetrahedronGeometry(4, 0);
    var mat = new THREE.MeshPhongMaterial({
        color: 0x009999,
        shininess: 0,
        specular: 0xffffff,
        shading: THREE.FlatShading
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0; //已经旋转的角度
    this.dist = 0;

}

//一群硬币
CoinsHolder = function () {

    this.mesh = new THREE.Object3D();
    this.coinInUse = [];

}

CoinsHolder.prototype.spawnCoins = function () {

    var nCoins = game.coinLength + Math.floor(Math.random() * 10);

    //不要生成到吃不到的地方
    var d = 600 + game.minHeight + (game.maxHeight - game.minHeight) * Math.random();

    var amplitude = 10 + Math.round(Math.random() * 5);

    //最后一波
    if (game.coinLength == 120) {
        d = 600 + (game.minHeight + game.maxHeight) / 2;
        amplitude = 15;
    }

    for (var i = 0; i < nCoins; i++) {

        var coin = new Coin();
        this.mesh.add(coin.mesh);
        this.coinInUse.push(coin);

        coin.angle = -(i * 0.02);
        coin.distance = d + Math.cos(i * 0.5) * amplitude;

        coin.mesh.position.y = -600 + coin.distance * Math.sin(coin.angle);
        coin.mesh.position.x = coin.distance * Math.cos(coin.angle);
    }

}

CoinsHolder.prototype.rotateCoins = function () {

    for (var i = 0; i < this.coinInUse.length; i++) {

        var coin = this.coinInUse[i];
        if (coin.exploding) continue;
        coin.angle += game.speed / 5;

        coin.mesh.position.y = -600 + coin.distance * Math.sin(coin.angle);
        coin.mesh.position.x = coin.distance * Math.cos(coin.angle);
        coin.mesh.rotation.z += Math.random() * .1;
        coin.mesh.rotation.y += Math.random() * .1;

        var diffPos = plane.mesh.position.clone().sub(coin.mesh.position.clone());
        var d = diffPos.length();

        if (d < 15) {
            this.coinInUse.splice(i, 1)[0];
            this.mesh.remove(coin.mesh);
            particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);

            game.curPoint += 5 + Math.floor(Math.random() * 5);

            var aud = document.createElement("AUDIO");
            aud.src = 'sound/coin.mp3';
            aud.play();
        }

        if (coin.angle > Math.PI) {
            this.coinInUse.splice(i, 1)[0];
            this.mesh.remove(coin.mesh);
            i--;
        }

    }

}


var coinsHolder;

function createCoinHolder() {

    coinsHolder = new CoinsHolder();
    scene.add(coinsHolder.mesh);

}

var lastSpawnTime = 0;
var finalSpawn = 0;

function updateCoin() {

    if (game.currentTime > 3 && game.currentTime <= 99 && game.currentTime - lastSpawnTime > (game.coinSpawnInterv / 1000) && Math.floor(game.currentTime * 1000) % game.coinSpawnInterv <= 100) {
        coinsHolder.spawnCoins();
        lastSpawnTime = game.currentTime;
    }

    if (game.currentTime > 99 && game.currentTime < 130 && game.currentTime - finalSpawn > 8) {

        finalSpawn = game.currentTime;
        game.coinLength = 120;
        coinsHolder.spawnCoins();


    }

}
////////////////////////////////////////来点敌人//////////////////////////////////

Enemy = function () {
    var geom = new THREE.TetrahedronGeometry(4, 2);
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shininess: 0,
        specular: 0xffffff,
        shading: THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
}

EnemyHolder = function () {
    this.mesh = new THREE.Object3D();
    this.enemyInUse = []; //方便遍历
}

EnemyHolder.prototype.spawnEnemy = function () {

    var stageEnemy = {
        1: 4,
        2: 8,
        3: 6,
        4: 4,
        5: 10,
        6: 0
    };
    var nEnemy = stageEnemy[game.stage];

    for (var i = 0; i < nEnemy; i++) {
        var enemy = new Enemy();
        enemy.angle = -(i * 0.1) + 1.2;
        enemy.distance = 600 + game.minHeight + (game.maxHeight - game.minHeight) * Math.random();
        enemy.mesh.position.y = -600 + Math.sin(enemy.angle) * enemy.distance;
        enemy.mesh.position.x = Math.cos(enemy.angle) * enemy.distance;

        this.mesh.add(enemy.mesh);
        this.enemyInUse.push(enemy);
    }

}

EnemyHolder.prototype.rotateEnemy = function () {

    for (var i = 0; i < this.enemyInUse.length; i++) {

        var enemy = this.enemyInUse[i];
        enemy.angle += game.speed / (3 + Math.random());

        enemy.mesh.position.y = -600 + Math.sin(enemy.angle) * enemy.distance;
        enemy.mesh.position.x = Math.cos(enemy.angle) * enemy.distance;
        enemy.mesh.rotation.z += Math.random() * .1;
        enemy.mesh.rotation.y += Math.random() * .1;

        var diffPos = plane.mesh.position.clone().sub(enemy.mesh.position.clone());
        var d = diffPos.length();

        if (d < 15) {
            particlesHolder.spawnParticles(enemy.mesh.position.clone(), 15, Colors.red, 1);
            this.enemyInUse.splice(i, 1)[0];
            this.mesh.remove(enemy.mesh);

            game.collisionSpeedX = 100 * diffPos.x / d;
            game.collisionSpeedY = 100 * diffPos.y / d;

            game.curPoint -= 50;

            i--;
        }

        if (enemy.angle > Math.PI) {
            this.enemyInUse.splice(i, 1)[0];
            this.mesh.remove(enemy.mesh);
            i--;
        }

    }
}

EnemyHolder.prototype.destroyAllEnemy = function () {

    var aud = document.createElement("AUDIO");
    aud.src = 'sound/destroy.mp3';
    aud.play();

    game.curPoint += 50;

    for (var i = 0; i < this.enemyInUse.length; i++) {

        enemy = this.enemyInUse[i];
        particlesHolder.spawnParticles(enemy.mesh.position.clone(), 15, Colors.red, 1);
        this.enemyInUse.splice(i, 1)[0];
        this.mesh.remove(enemy.mesh);
        i--;


    }

}

var enemyHolder;

function createEnemyHolder() {
    enemyHolder = new EnemyHolder();
    scene.add(enemyHolder.mesh);
}

var lastEnemyTime = 0;

function updateEnemy() {

    if (game.currentTime > 3 && game.currentTime <= 130 && game.currentTime - lastEnemyTime > (game.coinSpawnInterv / 1000) && Math.floor(game.currentTime * 1000) % game.coinSpawnInterv <= 100) {
        enemyHolder.spawnEnemy();
        lastEnemyTime = game.currentTime;
    }

}



////////////////////////////////////////来点音乐//////////////////////////////////


function initBgm() {
    //进度条的left从百分之三十到百分之七十
    var cursor = document.getElementById("cursor");
    var bgm = document.getElementById("bgm");
    var duration = bgm.duration;

    //onsole.log(duration); //单位是秒

    var wave = document.getElementById('wave');
    var context = wave.getContext('2d');

    var waveWidth = wave.width;
    var waveHeight = wave.height;

    if (window.AudioContext) var AudCtx = new AudioContext();
    else var AudCtx = new webkitAudioContext();

    var src = AudCtx.createMediaElementSource(bgm);
    var analyser = AudCtx.createAnalyser();

    src.connect(analyser);
    analyser.connect(AudCtx.destination);
    analyser.fftSize = 128;

    var bufferLength = analyser.frequencyBinCount;

    var barWidth = (waveWidth / bufferLength) - 2;
    var barHeight;

    var dataArray = new Uint8Array(bufferLength);

    function renderWave() {

        requestAnimationFrame(renderWave);

        game.currentTime = bgm.currentTime;
        var percentLeft = normalize(game.currentTime, 0, duration, 30, 70);

        cursor.style.left = percentLeft + '%';

        context.fillStyle = '#e4e0ba';
        context.fillRect(0, 0, waveWidth, waveHeight); //画布拓展全屏,动态调整

        analyser.getByteFrequencyData(dataArray);

        var curPos = 0;

        for (var i = 0; i < bufferLength; i++) {
            var data = dataArray[i];

            var percentV = data / 255; //纵向比例
            var percentH = i / bufferLength; //横向比例

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


function handleKeyPress() {

    if (game.currentTime > 138) return;

    var stageEnergy = {
        1: 4,
        2: 2,
        3: 3,
        4: 4,
        5: 1,
        6: 4
    };

    var beat = Math.floor(game.currentTime * 1000) % game.bpm;

    //在拍子上
    if (beat <= 200 || beat >= game.bpm - 200) {

        game.curPoint += 10;

        if (++game.curBeats >= stageEnergy[game.stage]) {
            game.curBeats = 0;
            enemyHolder.destroyAllEnemy();

        }
    } else {
        game.curPoint -= 200;
    }


}

function updateUI() {

    var beatArea = document.getElementById('beat-area');

    beatArea.innerHTML = '';

    var bar;

    if(game.stage == 1 || game.stage == 4)bar = '<div class="beat-bar-4"></div>';
    if(game.stage == 2)bar = '<div class="beat-bar-2"></div>';
    if(game.stage == 3)bar = '<div class="beat-bar-3"></div>';
    if(game.stage == 5)beatArea.innerHTML = '<div class="beat-bar-1">FEVER!</div>';

    for (var i = 0; i < game.curBeats; i++) {
        beatArea.innerHTML += bar;
    }


    var scoreEl = document.getElementById('point');
    var curScore = parseInt(scoreEl.innerHTML);

    var targetScore = game.curPoint;

    curScore += Math.floor((targetScore - curScore) / 5);

    scoreEl.innerHTML = curScore;

}

function updatePlane() {

    var targetY = normalize(mousePos.y, -.75, .75, game.minHeight, game.maxHeight);
    var targetX = normalize(mousePos.x, -.75, .75, game.minFront, game.maxFront);

    //碰撞
    game.collisionPosX += game.collisionSpeedX;
    targetX += game.collisionPosX;
    game.collisionPosY += game.collisionSpeedY;
    targetY += game.collisionPosY;

    game.collisionSpeedX += (0 - game.collisionSpeedX) * 0.5;
    game.collisionPosX += (0 - game.collisionPosX) * 0.2;
    game.collisionSpeedY += (0 - game.collisionSpeedY) * 0.5;
    game.collisionPosY += (0 - game.collisionPosY) * 0.2;

    // 在每帧通过添加剩余距离的一小部分的值移动飞机
    plane.mesh.position.y += (targetY - plane.mesh.position.y) * 0.1;
    plane.mesh.position.x += (targetX - plane.mesh.position.x) * 0.1;

    // 剩余的距离按比例转动飞机
    plane.mesh.rotation.z = (targetY - plane.mesh.position.y) * 0.0128;
    plane.mesh.rotation.x = (plane.mesh.position.y - targetY) * 0.0064;

    plane.propeller.rotation.x += 0.3;

    plane.pilot.updatePilot();

}

////////////////////////////////////////初始化//////////////////////////////////

window.onload = function () {

    resetGame();

    createScene();
    createLights();
    createSea();
    //游戏的主角
    createPlane();

    createCoinHolder();
    createEnemyHolder();
    createParticlesHolder();

    createSky();
    sea.updateWaves();

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
    document.addEventListener('keyup', handleKeyPress, false);

    //谢幕
    setTimeout(function () {

        $('#thank').animate({
            opacity: 1,
            top: '30%'
        }, 2000);

    }, 140000);

    setTimeout(function () {

        $('#thank').animate({
            opacity: 0,
            top: '25%'
        }, 2000);

    }, 144000);

    setTimeout(function () {

        $('#logo').animate({
            opacity: 1,
            top: '35%'
        }, 2000);


    }, 146000);

    setTimeout(function () {

        $('#logo').animate({
            opacity: 0,
            top: '30%'
        }, 'slow');


    }, 155000)


    initBgm();

    loop();

}



function loop() {

    //每帧调用
    renderer.render(scene, camera);

    //转起来
    sky.mesh.rotation.z += game.speed;
    sea.updateWaves();

    //更新飞机位置和螺旋桨　
    updatePlane();

    updateBeat();

    updateUI();

    updateCoin();
    coinsHolder.rotateCoins();

    updateEnemy();
    enemyHolder.rotateEnemy();

    requestAnimationFrame(loop);
}