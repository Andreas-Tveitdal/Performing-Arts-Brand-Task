// "use strict";
const canvas = document.getElementById("canvas");
if (!canvas.getContext) {
    throw new Error("No context found2");
}
const ctx = canvas.getContext("2d");
const player = {
    xPos: 100,
    yPos: 100,
    width: 50,
    height: 50,
    hp: 100,
    state: 0
};
const mainEnemy = {
    xPos: 100,
    yPos: 100,
    width: 50,
    height: 50,
    hp: 100,
    state: 0
};
const enemyProjectiles = [];
const playerProjectiles = [];
function updateProjectiles(projectileList) {
    for (const projectile of projectileList) {
        projectile.xPos += projectile.changeX;
        projectile.yPos += projectile.changeY;
    }
}
function drawProjectiles(projectileList) {
    for (const projectile of projectileList) {
        ctx.fillStyle = "red";
        ctx.fillRect(projectile.xPos, projectile.yPos, 1, 1);
    }
}
function objectStrafeHorizontally(object) {
    if (!object.state) {
        object.state = 1;
    }
    else {
        if (object.xPos > 500) {
            object.state = -1;
        }
        else if (object.xPos < 100) {
            object.state = 1;
        }
    }
    object.xPos += object.state;
}
function update() {
    updateProjectiles(enemyProjectiles);
    updateProjectiles(playerProjectiles);
    objectStrafeHorizontally(mainEnemy);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
setInterval(update, 1000);
