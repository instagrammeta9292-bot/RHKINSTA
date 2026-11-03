
import * as THREE from
'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101b42);
scene.fog = new THREE.Fog(0x101b42, 20, 100);

// CAMERA
const camera = new THREE.PerspectiveCamera(
    70, innerWidth / innerHeight, 0.1, 200
);

camera.position.set(0, 0, 12);

// RENDERER
const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(new THREE.AmbientLight(0xffffff, 2));

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(5, 10, 10);
scene.add(light);

// MATERIALS
const gold = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    metalness: 0.5,
    roughness: 0.3
});

const red = new THREE.MeshStandardMaterial({
    color: 0xff2222
});

// TEMPORARY PLAYER HEAD
const player = new THREE.Group();
scene.add(player);

const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 32, 32),
    new THREE.MeshStandardMaterial({color: 0xd99a70})
);
player.add(head);

// TEMPORARY HAIR
const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 32, 16),
    new THREE.MeshStandardMaterial({color: 0x171717})
);

hair.scale.set(1, 0.5, 1);
hair.position.y = 0.55;
player.add(hair);

player.position.set(-3, 0, 0);

// TARGET HEAD
const target = new THREE.Group();
scene.add(target);

const targetHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshStandardMaterial({color: 0xd9a17a})
);
target.add(targetHead);

const targetHair = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 24, 16),
    new THREE.MeshStandardMaterial({color: 0x111111})
);
targetHair.scale.y = 0.5;
targetHair.position.y = 0.5;
target.add(targetHair);

target.position.set(3, 1, -4);

// STARS
const stars = [];

for(let i=0; i<100; i++) {
    const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        new THREE.MeshBasicMaterial({color: 0xffffff})
    );

    star.position.set(
        (Math.random()-0.5)*25,
        (Math.random()-0.5)*15,
        -Math.random()*80
    );

    scene.add(star);
    stars.push(star);
}

// OBSTACLES
const obstacles = [];

function createObstacle() {
    const geometry = new THREE.TorusGeometry(1.2, 0.25, 8, 24);

    const obstacle = new THREE.Mesh(geometry, red);

    obstacle.position.set(
        7,
        (Math.random()-0.5)*7,
        -60
    );

    scene.add(obstacle);
    obstacles.push(obstacle);
}

// COINS
const coins = [];

function createCoin() {
    const coin = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.1, 8, 20),
        gold
    );

    coin.position.set(
        5,
        (Math.random()-0.5)*6,
        -55
    );

    scene.add(coin);
    coins.push(coin);
}

// GAME VARIABLES
let active = false;
let velocity = 0;
let score = 0;
let coinCount = 0;
let speed = 12;
let obstacleTimer = 0;
let coinTimer = 0;

const gravity = 16;
const flapPower = 7;

// SOUND
const tapSound = new Audio("assets/tap.mp3");
const hitSound = new Audio("assets/hit.mp3");

function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

// FLY
function flap() {
    if(!active) return;

    velocity = flapPower;
    playSound(tapSound);
}

// INPUT
const tapArea = document.getElementById("tapArea");

tapArea.addEventListener("pointerdown", e => {
    if(e.target.closest("button")) return;
    flap();
});

// COLLISION DISTANCE
function collision(a, b, distance) {
    return a.distanceTo(b) < distance;
}
function updateGame(dt) {
    if(!active) return;

    // GRAVITY
    velocity -= gravity * dt;
    player.position.y += velocity * dt;

    // PLAYER ROTATION
    player.rotation.z = THREE.MathUtils.clamp(
        velocity * 0.06, -0.6, 0.5
    );

    // TARGET MOVEMENT
    target.position.x = 3 + Math.sin(Date.now()*0.001)*0.5;
    target.position.y = 1.5 + Math.sin(Date.now()*0.002)*0.6;

    // MOVE STARS
    stars.forEach(star => {
        star.position.z += speed * dt;

        if(star.position.z > 10) {
            star.position.z = -80;
            star.position.x = (Math.random()-0.5)*25;
            star.position.y = (Math.random()-0.5)*15;
        }
    });

    // SPAWN OBSTACLES
    obstacleTimer += dt;
    coinTimer += dt;

    if(obstacleTimer > 2) {
        createObstacle();
        obstacleTimer = 0;
    }

    if(coinTimer > 1.2) {
        createCoin();
        coinTimer = 0;
    }

    // MOVE OBSTACLES
    for(let i=obstacles.length-1; i>=0; i--) {
        const obj = obstacles[i];

        obj.position.x -= speed * dt;

        if(collision(player.position, obj.position, 1.5)) {
            endGame();
            return;
        }

        if(obj.position.x < -15) {
            scene.remove(obj);
            obstacles.splice(i,1);
        }
    }

    // MOVE COINS
    for(let i=coins.length-1; i>=0; i--) {
        const coin = coins[i];

        coin.position.x -= speed * dt;
        coin.rotation.y += dt*5;

        if(collision(player.position, coin.position, 1)) {
            scene.remove(coin);
            coins.splice(i,1);

            coinCount++;
            score += 10;
        }

        else if(coin.position.x < -15) {
            scene.remove(coin);
            coins.splice(i,1);
        }
    }

    // BOUNDARIES
    if(player.position.y > 7 || player.position.y < -7) {
        endGame();
        return;
    }

    // CHASE TARGET
    score += dt*2;

    document.getElementById("score").textContent =
        Math.floor(score);

    document.getElementById("coins").textContent =
        coinCount;
}

// START
function startGame() {
    obstacles.forEach(o => scene.remove(o));
    coins.forEach(c => scene.remove(c));

    obstacles.length = 0;
    coins.length = 0;

    player.position.set(-3,0,0);
    target.position.set(3,1,-4);

    velocity = 0;
    score = 0;
    coinCount = 0;
    speed = 12;
    obstacleTimer = 0;
    coinTimer = 0;

    active = true;

    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameOver").classList.add("hidden");
}

// GAME OVER
function endGame() {
    active = false;
    playSound(hitSound);

    document.getElementById("finalScore").textContent =
        "Score: " + Math.floor(score) +
        " | Coins: " + coinCount;

    document.getElementById("gameOver").classList.remove("hidden");
}

document.getElementById("startBtn").onclick = startGame;
document.getElementById("restartBtn").onclick = startGame;

// ANIMATION
let previousTime = 0;

function animate(time) {
    requestAnimationFrame(animate);

    const dt = Math.min((time-previousTime)/1000,0.04);
    previousTime = time;

    if(active) {
        updateGame(dt);
    }

    camera.lookAt(0,0,0);

    renderer.render(scene,camera);
}

requestAnimationFrame(animate);

// RESIZE
window.addEventListener("resize", () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
});
