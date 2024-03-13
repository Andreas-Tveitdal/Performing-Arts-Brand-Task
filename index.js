// "use strict";

const deathscreendiv = document.getElementById("deathscreen");
deathscreendiv.style.animation = "fade-in 2s ease 1s forwards";
const body = document.getElementById("body");
const canvas = document.getElementById("canvas");
canvas.width = body.offsetWidth;
canvas.height = body.offsetHeight;
if (!canvas.getContext) {
    throw new Error("No context found2");
}
const ctx = canvas.getContext("2d");
const hurtSFX = new Audio("./hurtSFX.wav");

// TODO: ADD TEXTURE FOR PLAYER
// TODO: ADD TEXTURE FOR ENEMY
// TODO: ADD TEXTURE FOR PROJECTILES
// TODO: MAKE ALL TEXTURES
// TODO: ADD DAMAGE SPLASH TEXT
// TODO: MAKE OBJECTS STOP PRODUCING PROJECTILES ONCE DEAD

const GAME_CONFIG_MAX_PROJECTILECOUNT = 10000;
const GAME_CONFIG_SPLASHTEXT_DURATION = 30;
const GAME_CONFIG_PLAYERPROJECTILES = true;

const PLAYER_CONFIG_WIDTH = 50;
const PLAYER_CONFIG_HEIGHT = 50;
const PLAYER_CONFIG_HEALTH = 10;
const PLAYER_CONFIG_SPEED = 3;
const PLAYER_CONFIG_DAMAGE = 2;
const PLAYER_START_X = (canvas.width - PLAYER_CONFIG_WIDTH) / 2;
const PLAYER_START_Y = (canvas.width - PLAYER_CONFIG_HEIGHT) / 2;
const PLAYER_PROJECTILE_WIDTH = 5;
const PLAYER_PROJECTILE_HEIGHT = 7;
const PLAYER_PROJECTILE_OFFSET_X = PLAYER_CONFIG_WIDTH / 2;
const PLAYER_PROJECTILE_OFFSET_Y = -10;
const PLAYER_PROJECTILE_COOLDOWN = 4;
const PLAYER_PROJECTILE_SPEED = -6;
const PLAYER_HEALTHBAR_X = canvas.width / 20;
const PLAYER_HEALTHBAR_Y = canvas.height - canvas.height / 30;
const PLAYER_HEALTHBAR_W = canvas.width / 4;
const PLAYER_HEALTHBAR_H = canvas.height / 100;

const ENEMY_CONFIG_WIDTH = 50;
const ENEMY_CONFIG_HEIGHT = 50;
const ENEMY_CONFIG_HEALTH = 3000;
const ENEMY_CONFIG_SPEED = 3;
const ENEMY_CONFIG_DAMAGE = 2;
const ENEMY_START_X = (canvas.width - ENEMY_CONFIG_WIDTH) / 2;
const ENEMY_START_Y = (canvas.width - ENEMY_CONFIG_HEIGHT) / 10;
const ENEMY_PROJECTILE_WIDTH = 5;
const ENEMY_PROJECTILE_HEIGHT = 7;
const ENEMY_PROJECTILE_OFFSET_X = ENEMY_CONFIG_WIDTH / 2;
const ENEMY_PROJECTILE_OFFSET_Y = -10;
const ENEMY_PROJECTILE_COOLDOWN = 3;
const ENEMY_PROJECTILE_SPEED = -6;
const ENEMY_HEALTHBAR_X = canvas.width / 20;
const ENEMY_HEALTHBAR_Y = canvas.height / 50;
const ENEMY_HEALTHBAR_W = canvas.width - 2 * ENEMY_HEALTHBAR_X;
const ENEMY_HEALTHBAR_H = canvas.height / 150;

const DELTATIME_MODIFIER = 10;

const isAlive = (function() {return this.hp > 0;})
const player = {
    xPos: PLAYER_START_X,
    yPos: PLAYER_START_Y,
    width: PLAYER_CONFIG_WIDTH,
    height: PLAYER_CONFIG_HEIGHT,
    hp: PLAYER_CONFIG_HEALTH,
    state: {
        alive: isAlive,
    }
};
const mainEnemy = {
    xPos: ENEMY_START_X,
    yPos: ENEMY_START_Y,
    width: ENEMY_CONFIG_WIDTH,
    height: ENEMY_CONFIG_HEIGHT,
    hp: ENEMY_CONFIG_HEALTH,
    state: {
        alive: isAlive,
    }
};
const enemyProjectiles = [];
const playerProjectiles = [];
const objectHitSplashTexts = [];

function removeFromList(item, list) {
    const itemIndex = list.indexOf(item);
    if (itemIndex !== -1) {
        list.splice(itemIndex, 1);
    }
}
function endGame() {
}

function changeProjectiles(projectile, _, time) {
    projectile.xPos += projectile.changeX * time;
    projectile.yPos += projectile.changeY * time;
}
function removeRedundantProjectiles(projectile, projectileList) {
    if (projectile.xPos < 0 || projectile.xPos > canvas.width ||
        projectile.yPos < 0 || projectile.yPos > canvas.height) {
        removeFromList(projectile, projectileList);
    }
}
function drawProjectiles(projectile) {
    ctx.fillStyle = "red";
    ctx.fillRect(projectile.xPos, projectile.yPos, projectile.width, projectile.height);
}
function updateProjectiles(updateFunctionList, projectileLists) {
    for (const projectileList of projectileLists) {
        for (const projectile of projectileList) {
            for (const updateFunction of updateFunctionList) {
                updateFunction(projectile, projectileList, deltaTime);
            }
        }
    }
}
function createPolarProjectile(x, y, w, h, a, d) {
    const toRad = (ang) => ang * Math.PI / 180
    const rad = toRad(a);
    const constructedProjectile = {
        xPos: x,
        yPos: y,
        width: w,
        height: h,
        changeX: Math.cos(rad),
        changeY: Math.sin(rad),
        damage: d
    }
    return constructedProjectile;
}

function drawHealthBar(x, y, w, h, m, c) {
    ctx.fillStyle = "gray";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, c / m * w, h);
}
function drawObjectHitSplashText(splashTextList) {
    ctx.font = "16px Comic Sans MS";
    ctx.fillStyle = "orange";
    ctx.textAlign = "center";
    for (splashText of splashTextList) {
        ctx.fillText(splashText.text, splashText.xPos, splashText.yPos);
        splashText.timeLeft -= 1;
        splashText.yPos -= 0.6;
        splashText.xPos += Math.random() * 4 - 2;
        if (splashText.timeLeft <= 0) removeFromList(splashText, splashTextList);
    }
}

function objectHitByProjectile(object, projectileList) {
    for (const projectile of projectileList) {
        if (object.xPos < projectile.xPos && projectile.xPos < object.xPos + object.width &&
            object.yPos < projectile.yPos && projectile.yPos < object.yPos + object.height) {
            return projectile;
        }
    }
    return false;
}
function drawObject(object) {
    ctx.fillStyle = "blue";
    ctx.fillRect(object.xPos, object.yPos, object.width, object.height);
}
function objectStrafeHorizontally(object) {
    if (!object.state.changeX) object.state.changeX = 1;
    if (object.xPos > 500) {
        object.state.changeX = -1 * deltaTime;
    } else if (object.xPos < 100) {
        object.state.changeX = 1 * deltaTime;
    }
    object.xPos += object.state.changeX;
}
function playerInstantiateProjectiles(object) {
    if (!object.state.cooldown) object.state.cooldown = 0;
    if (object.state.cooldown < PLAYER_PROJECTILE_COOLDOWN) {
        object.state.cooldown += 1;
        return;
    }
    object.state.cooldown = 0;
    playerProjectiles.push({
        xPos: object.xPos + PLAYER_PROJECTILE_OFFSET_X,
        yPos: object.yPos + PLAYER_PROJECTILE_OFFSET_Y,
        width: PLAYER_PROJECTILE_WIDTH,
        height: PLAYER_PROJECTILE_HEIGHT,
        changeX: 0,
        changeY: PLAYER_PROJECTILE_SPEED,
        damage: PLAYER_CONFIG_DAMAGE
    });
}

function weirdEnemyAttack(object) {
    if (!object.state.spinAttack) object.state.spinAttack = {};
    if (!object.state.spinAttack.currentAngle) object.state.spinAttack.currentAngle = 0;
    enemyProjectiles.push(createPolarProjectile(
        object.xPos + object.width / 2,
        object.yPos + object.height / 2,
        ENEMY_PROJECTILE_WIDTH,
        ENEMY_PROJECTILE_HEIGHT,
        object.state.spinAttack.currentAngle,
        ENEMY_CONFIG_DAMAGE
    ));
    object.state.spinAttack.currentAngle += 1;
}
function circleAttack(object) {
    for (let i = 0; i < 360; i += 20) {
        enemyProjectiles.push(createPolarProjectile(
            object.xPos + object.width / 2,
            object.yPos + object.height / 2,
            ENEMY_PROJECTILE_WIDTH,
            ENEMY_PROJECTILE_HEIGHT,
            i,
            ENEMY_CONFIG_DAMAGE
        ));
    }
}

function handleProjectileHit(object, projectilesCanHurt) {
    const projectileHit = objectHitByProjectile(object, projectilesCanHurt);
    if (projectileHit) {
        hurtSFX.play();
        const offset = Math.random() * 16 - 8;
        objectHitSplashTexts.push({
            text: projectileHit.damage.toString(),
            xPos: projectileHit.xPos + offset,
            yPos: projectileHit.yPos + offset,
            timeLeft: GAME_CONFIG_SPLASHTEXT_DURATION
        });
        object.hp -= projectileHit.damage;
        removeFromList(projectileHit, projectilesCanHurt);
    }
}
function handlePlayerLife(object) {
    handleProjectileHit(object, enemyProjectiles);
    if (object.hp > 0) { 
        drawObject(object);
        if (GAME_CONFIG_PLAYERPROJECTILES) playerInstantiateProjectiles(player);
        drawHealthBar(
            PLAYER_HEALTHBAR_X,
            PLAYER_HEALTHBAR_Y,
            PLAYER_HEALTHBAR_W,
            PLAYER_HEALTHBAR_H,
            PLAYER_CONFIG_HEALTH,
            player.hp
        );
    } else {
        gameRunning = false;
    }
}

function handleMainEnemyAttacks(object) {
    if (!object.state.circleAttack) object.state.circleAttack = {};
    if (!object.state.circleAttack.delay) object.state.circleAttack.delay = 0;
    if (object.state.circleAttack.delay > 100) {
        circleAttack(object);
        object.state.circleAttack.delay = 0;
    }
    object.state.circleAttack.delay += 1;
}
function handleMainEnemyLife(object) {
    if (GAME_CONFIG_PLAYERPROJECTILES) {
        handleProjectileHit(object, playerProjectiles);
    } else {
        object.hp -= PLAYER_CONFIG_DAMAGE;
    }
    if (object.hp > 0) {
        drawObject(object);
        handleMainEnemyAttacks(object);
        drawHealthBar(
            ENEMY_HEALTHBAR_X,
            ENEMY_HEALTHBAR_Y,
            ENEMY_HEALTHBAR_W,
            ENEMY_HEALTHBAR_H,
            ENEMY_CONFIG_HEALTH,
            mainEnemy.hp,
        );
    }
}
function handleKeyPresses(keyspressed) {
    if (keyspressed.w || keyspressed.ArrowUp) {
        player.yPos += -PLAYER_CONFIG_SPEED * deltaTime;
    }
    if (keyspressed.a || keyspressed.ArrowLeft) {
        player.xPos += -PLAYER_CONFIG_SPEED * deltaTime;
    }
    if (keyspressed.s || keyspressed.ArrowDown) {
        player.yPos += PLAYER_CONFIG_SPEED * deltaTime;
    }
    if (keyspressed.d || keyspressed.ArrowRight) {
        player.xPos += PLAYER_CONFIG_SPEED * deltaTime;
    }
}
function update(renderTimestamp) {
    if (!lastTimestamp) lastTimestamp = renderTimestamp;
    deltaTime = (renderTimestamp - lastTimestamp) / DELTATIME_MODIFIER;
    lastTimestamp = renderTimestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleKeyPresses(inputKeysPressed);
    objectStrafeHorizontally(mainEnemy);
    updateProjectiles([
        changeProjectiles,
        removeRedundantProjectiles,
        drawProjectiles
    ], [
        playerProjectiles,
        enemyProjectiles
    ]);

    handlePlayerLife(player);
    handleMainEnemyLife(mainEnemy);

    drawObjectHitSplashText(objectHitSplashTexts);
    if (gameRunning) { window.requestAnimationFrame(update); }
    else { deathscreendiv.style.animation = "fade-out 0.5s ease forwards, 0s"; }
}

let deltaTime = null;
let lastTimestamp = null;
let gameRunning = true;
window.requestAnimationFrame(update);

const inputKeysPressed = {};
document.addEventListener("keydown", (event) => {
    inputKeysPressed[event.key] = true;
});
document.addEventListener("keyup", (event) => {
    inputKeysPressed[event.key] = false;
});

