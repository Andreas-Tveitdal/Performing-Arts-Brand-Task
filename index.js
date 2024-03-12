// "use strict";

const body = document.getElementById("body");
const canvas = document.getElementById("canvas");
canvas.width = body.offsetWidth;
canvas.height = body.offsetHeight;
if (!canvas.getContext) {
    throw new Error("No context found2");
}
const ctx = canvas.getContext("2d");

const MAX_PROJECTILECOUNT = 10000;

const PLAYER_CONFIG_WIDTH = 50;
const PLAYER_CONFIG_HEIGHT = 50;
const PLAYER_CONFIG_HEALTH = 100;
const PLAYER_CONFIG_SPEED = 3;
const PLAYER_START_X = (canvas.width - PLAYER_CONFIG_WIDTH) / 2;
const PLAYER_START_Y = (canvas.width - PLAYER_CONFIG_HEIGHT) / 2;
const PLAYER_PROJECTILE_OFFSET_Y = -10;
const PLAYER_PROJECTILE_COOLDOWN = 4;
const PLAYER_PROJECTILE_SPEED = -6;
const PLAYER_PROJECTILE_DAMAGE = 2;

const DELTATIME_MODIFIER = 10;

const player = {
    xPos: PLAYER_START_X,
    yPos: PLAYER_START_Y,
    width: PLAYER_CONFIG_WIDTH,
    height: PLAYER_CONFIG_HEIGHT,
    hp: PLAYER_CONFIG_HEALTH,
    state: {}
};
const mainEnemy = {
    xPos: 100,
    yPos: 100,
    width: 50,
    height: 50,
    hp: 100,
    state: {}
};
const enemyProjectiles = [];
const playerProjectiles = [];

function changeProjectiles(projectile) {
    projectile.xPos += projectile.changeX;
    projectile.yPos += projectile.changeY;
}
function deleteRedundantProjectiles(projectile, projectileList) {
    if (projectile.xPos < 0 || projectile.xPos > canvas.width ||
        projectile.yPos < 0 || projectile.yPos > canvas.height) {
        const projectileIndex = projectileList.indexOf(projectile);
        if (projectileIndex !== -1) {
            projectileList.splice(projectileIndex, 1);
        }
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
                updateFunction(projectile, projectileList);
            }
        }
    }
}

function objectHitByProjectile(object, projectileList) {
    for (const projectile of projectileList) {
        if (projectile.xPos > object.xPos && projectile.xPos > object.xPos + object.width &&
            projectile.yPos > object.yPos && projectile.yPos > object.yPos + object.height) {
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
    console.log("new projectile");
    playerProjectiles.push({
        xPos: object.xPos + object.width / 2,
        yPos: object.yPos + PLAYER_PROJECTILE_OFFSET_Y,
        width: 5,
        height: 7,
        changeX: 0,
        changeY: PLAYER_PROJECTILE_SPEED * deltaTime,
        damage: PLAYER_PROJECTILE_DAMAGE
    });
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
        deleteRedundantProjectiles,
        drawProjectiles
    ], [
        playerProjectiles,
        enemyProjectiles
    ]);
    drawObject(mainEnemy);
    drawObject(player);
    const projectileHitPlayer = objectHitByProjectile(player, enemyProjectiles);
    if (projectileHitPlayer) {
        player.hp -= projectileHitPlayer.damage;
    }
    const projectileHitEnemy = objectHitByProjectile(mainEnemy, playerProjectiles);
    if (projectileHitEnemy) {
        mainEnemy.hp -= projectileHitEnemy.damage;
        alert(mainEnemy.hp);
    }
    playerInstantiateProjectiles(player);
    window.requestAnimationFrame(update);
}

// REMOVE BELOW LINE WHEN FIXED MOVEMENT
let deltaTime = null;
let lastTimestamp = null;
window.requestAnimationFrame(update);

const inputKeysPressed = {};
document.addEventListener("keydown", (event) => {
    inputKeysPressed[event.key] = true;
});
document.addEventListener("keyup", (event) => {
    inputKeysPressed[event.key] = false;
});

