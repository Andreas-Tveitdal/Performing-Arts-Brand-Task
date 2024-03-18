// "use strict";
// start preload-textures {{{
const sourceImages = [
    "bombastus_1280x960.png",
    "bombastus_55x57.png",
    "enemy_3200x2400.jpg",
    "enemy_42x30.png",
    "gigantus_3200x2400.jpg",
    "gigantus_53x59.png",
    "gigantus_64x48.png",
    "gigantus_55x61.png",
];
const gameTextures = {};
Promise.all(sourceImages.map((image) => {
    return new Promise((resolve, reject) => {
        const texture = new Image();
        texture.onload = () => resolve({
            texture: texture,
            name: image
        });
        texture.onerror = () => reject("Bitch I dunno the image didn't load");
        texture.src = image;
    });
}))
    .then((textures) => {
        for (const texture of textures) {
            gameTextures[texture.name] = texture.texture;
        }
        startGame();
    })
    .catch((error) => {
        console.log(error);
    });
// end preload-textures }}}

// start initialization {{{
const deathscreendiv = document.getElementById("deathscreen");
const deathscreentext = document.getElementById("deathtext");
const deathscreenbutton = document.getElementById("deathbutton");
const winscreendiv = document.getElementById("winscreen");
const winscreentext = document.getElementById("wintext");
const winscreenbutton = document.getElementById("winbutton");
const body = document.getElementById("body");
const canvas = document.getElementById("canvas");
if (!canvas) {
    throw new Error("No canvas found");
}
canvas.width = body.offsetWidth;
canvas.height = body.offsetHeight;
if (!canvas.getContext) {
    throw new Error("No context found");
}
const ctx = canvas.getContext("2d");
const playerHurtSFX = new Audio("hurtSFX.wav");
const playerHitSFX = new Audio("hitSFX.wav");
const backgroundAudioFantasy = new Audio("background_fantasy.wav");
const backgroundAudioChiptune = new Audio("background_chiptune.wav");
backgroundAudioFantasy.loop = true;
backgroundAudioChiptune.loop = true;
backgroundAudioChiptune.play();
// end initialization }}}

// TODO: ADD TEXTURE FOR ENEMY
// TODO: ADD TEXTURE FOR PROJECTILES

// start config {{{
const GAME_CONFIG_MAX_PROJECTILECOUNT = 10000;
const GAME_CONFIG_SPLASHTEXT_DURATION = 30;
const GAME_CONFIG_PLAYERPROJECTILES = true;
const GAME_CONFIG_DELTATIME_MODIFIER = 10;
const GAME_CONFIG_DISPLAY_HITBOX = false;

const PLAYER_CONFIG_HEALTH = 14;
const PLAYER_CONFIG_SPEED = 2.5;
const PLAYER_CONFIG_DAMAGE = 80;
const PLAYER_CONFIG_WIDTH = 50;
const PLAYER_CONFIG_HEIGHT = 50;
const PLAYER_CONFIG_TEXTURE_WIDTH = 53;
const PLAYER_CONFIG_TEXTURE_HEIGHT = 59;
const PLAYER_CONFIG_TEXTURE_OFFSET_X = -3;
const PLAYER_CONFIG_TEXTURE_OFFSET_Y = -4;
const PLAYER_TEXTURE = "gigantus_55x61.png";
const PLAYER_START_X = (canvas.width - PLAYER_CONFIG_WIDTH) / 2;
const PLAYER_START_Y = (canvas.width - PLAYER_CONFIG_HEIGHT) / 2;
const PLAYER_PROJECTILE_COUNT = 1;
const PLAYER_PROJECTILE_SPACING = 15;
const PLAYER_PROJECTILE_WIDTH = 5;
const PLAYER_PROJECTILE_HEIGHT = 7;
const PLAYER_PROJECTILE_OFFSET_X = PLAYER_CONFIG_WIDTH / 2;
const PLAYER_PROJECTILE_OFFSET_Y = -10;
const PLAYER_PROJECTILE_COOLDOWN = 4;
const PLAYER_PROJECTILE_SPEED = 10;
const PLAYER_HEALTHBAR_X = canvas.width / 20;
const PLAYER_HEALTHBAR_Y = canvas.height - canvas.height / 30;
const PLAYER_HEALTHBAR_W = canvas.width / 4;
const PLAYER_HEALTHBAR_H = canvas.height / 100;

const ENEMY_CONFIG_HEALTH = 10000;
const ENEMY_CONFIG_SPEED = 2;
const ENEMY_CONFIG_DAMAGE = 1;
const ENEMY_CONFIG_WIDTH = 50;
const ENEMY_CONFIG_HEIGHT = 50;
const ENEMY_CONFIG_TEXTURE_WIDTH = 53;
const ENEMY_CONFIG_TEXTURE_HEIGHT = 59;
const ENEMY_CONFIG_TEXTURE_OFFSET_X = -3;
const ENEMY_CONFIG_TEXTURE_OFFSET_Y = -4;
const ENEMY_TEXTURE = "enemy_42x30.png";
const ENEMY_START_X = (canvas.width - ENEMY_CONFIG_WIDTH) / 2;
const ENEMY_START_Y = (canvas.width - ENEMY_CONFIG_HEIGHT) / 10;
const ENEMY_PROJECTILE_WIDTH = 5;
const ENEMY_PROJECTILE_HEIGHT = 7;
const ENEMY_PROJECTILE_OFFSET_X = ENEMY_CONFIG_WIDTH / 2;
const ENEMY_PROJECTILE_OFFSET_Y = -10;
const ENEMY_PROJECTILE_COOLDOWN = 3;
const ENEMY_PROJECTILE_SPEED = 3;
const ENEMY_HEALTHBAR_X = canvas.width / 20;
const ENEMY_HEALTHBAR_Y = canvas.height / 50;
const ENEMY_HEALTHBAR_W = canvas.width - 2 * ENEMY_HEALTHBAR_X;
const ENEMY_HEALTHBAR_H = canvas.height / 150;
// end config }}}

// start create-things {{{
function createNormalProjectile(x, y, w, h, cx, cy, d) {
    return {
        xPos: x,
        yPos: y,
        width: w,
        height: h,
        changeX: cx,
        changeY: cy,
        damage: d
    };
}
function createPolarProjectile(x, y, w, h, a, s, d) {
    const toRad = (ang) => ang * Math.PI / 180
    const rad = toRad(a);
    return {
        xPos: x,
        yPos: y,
        width: w,
        height: h,
        changeX: Math.cos(rad) * s,
        changeY: Math.sin(rad) * s,
        damage: d
    };
}
function createEnemyObject() {
    return {
        xPos: ENEMY_START_X,
        yPos: ENEMY_START_Y,
        width: ENEMY_CONFIG_WIDTH,
        height: ENEMY_CONFIG_HEIGHT,
        hp: ENEMY_CONFIG_HEALTH,
        state: {
            hurtSFX: playerHitSFX
        }
    };
}
function createPlayerObject() {
    return {
        xPos: PLAYER_START_X,
        yPos: PLAYER_START_Y,
        width: PLAYER_CONFIG_WIDTH,
        height: PLAYER_CONFIG_HEIGHT,
        hp: PLAYER_CONFIG_HEALTH,
        state: {
            hurtSFX: playerHurtSFX
        }
    };
}
// end create-things }}}

// start tools {{{
function removeFromList(item, list) {
    const itemIndex = list.indexOf(item);
    if (itemIndex !== -1) {
        list.splice(itemIndex, 1);
    }
}
// end tools }}}
// start projectiles {{{
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
function updateProjectiles(updateFunctionList, projectileLists) {
    for (const projectileList of projectileLists) {
        for (const projectile of projectileList) {
            for (const updateFunction of updateFunctionList) {
                updateFunction(projectile, projectileList, deltaTime);
            }
        }
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
function playerInstantiateProjectiles(object) {
    if (!object.state.cooldown) object.state.cooldown = 0;
    if (object.state.cooldown < PLAYER_PROJECTILE_COOLDOWN) {
        object.state.cooldown += 1;
        return;
    }
    object.state.cooldown = 0;
    for (let i = 0; i < PLAYER_PROJECTILE_COUNT; i++) {
        playerProjectiles.push(createPolarProjectile(
            object.xPos + PLAYER_PROJECTILE_OFFSET_X - ((PLAYER_PROJECTILE_COUNT - 1) / 2 + i) * PLAYER_PROJECTILE_SPACING,
            object.yPos + PLAYER_PROJECTILE_OFFSET_Y,
            PLAYER_PROJECTILE_WIDTH,
            PLAYER_PROJECTILE_HEIGHT,
            270,
            PLAYER_PROJECTILE_SPEED,
            PLAYER_CONFIG_DAMAGE
        ));
    }
}
// end projectiles }}}
// start drawing-methods {{{
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
function drawHitbox(object, color) {
    ctx.fillStyle = color;
    ctx.fillRect(object.xPos, object.yPos, object.width, object.height);
}
function drawProjectiles(projectile) {
    ctx.fillStyle = "red";
    ctx.fillRect(projectile.xPos, projectile.yPos, projectile.width, projectile.height);
}
// end drawing-methods }}}
// start enemy {{{
function weirdEnemyAttack(object) {
    if (!object.state.spinAttack) object.state.spinAttack = {};
    if (!object.state.spinAttack.currentAngle) object.state.spinAttack.currentAngle = 0;
    enemyProjectiles.push(createPolarProjectile(
        object.xPos + object.width / 2,
        object.yPos + object.height / 2,
        ENEMY_PROJECTILE_WIDTH,
        ENEMY_PROJECTILE_HEIGHT,
        object.state.spinAttack.currentAngle,
        ENEMY_PROJECTILE_SPEED,
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
            ENEMY_PROJECTILE_SPEED,
            ENEMY_CONFIG_DAMAGE
        ));
    }
}
function enemyMovementHorizontally(object) {
    if (!object.state.changeX) object.state.changeX = ENEMY_CONFIG_SPEED * deltaTime;
    if (object.xPos > canvas.width * 0.8) {
        object.state.changeX = -ENEMY_CONFIG_SPEED;
    } else if (object.xPos < canvas.width * 0.2) {
        object.state.changeX = ENEMY_CONFIG_SPEED;
    }
    object.xPos += object.state.changeX;
}
function enemyMovementRandomConstant(object, time, delay) {
    if (!object.state.randomMoveGoalDelay) object.state.randomMoveGoalDelay = 0;
    if (!object.state.changeX || !object.state.changeY) object.state.changeX, object.state.changeY = null, null;
    const LIMX = canvas.width * 0.9;
    const LIMY = canvas.height * 0.4;
    const MINX = canvas.width * 0.1;
    const MINY = canvas.height * 0.1; 
    function setChange() {
        const randX = Math.random();
        const randY = Math.random();
        xTarget = randX * (LIMX - MINX) + MINX - object.xPos;
        yTarget = randY * (LIMY - MINY) + MINY - object.yPos;
        object.state.changeX = xTarget / time;
        object.state.changeY = yTarget / time;
    }
    if (object.state.randomMoveGoalDelay >= delay) {
        setChange();
        object.state.randomMoveGoalDelay = 0;
    }
    object.state.randomMoveGoalDelay += 1;
    object.xPos += object.state.changeX;
    object.yPos += object.state.changeY;
}
function enemyMovementRandomVaried(object, delay, speed) {
    if (!object.state.randomMoveGoalDelay) object.state.randomMoveGoalDelay = 0;
    if (!object.state.changeX || !object.state.changeY) {
        object.state.changeX = null;
        object.state.changeY = null;
    }
    const LIMX = canvas.width * 0.9;
    const LIMY = canvas.height * 0.4;
    const MINX = canvas.width * 0.1;
    const MINY = canvas.height * 0.1;
    function setChange() {
        const randX = Math.random();
        const randY = Math.random();
        xTarget = randX * (LIMX - MINX) + MINX - object.xPos;
        yTarget = randY * (LIMY - MINY) + MINY - object.yPos;
        if (xTarget > 0) {
            object.state.changeX = speed;
        }
        else if (xTarget < 0) {
            object.state.changeX = -speed;
        }
        else {
            object.state.changeX = 0;
        }
        if (yTarget > 0) {
            object.state.changeY = speed;
        }
        else if (yTarget < 0) {
            object.state.changeY = -speed;
        }
        else {
            object.state.changeY = 0;
        }
    }
    if (object.state.randomMoveGoalDelay >= delay) {
        setChange();
        object.state.randomMoveGoalDelay = 0;
    }
    object.state.randomMoveGoalDelay += 1;
    object.xPos += object.state.changeX;
    object.yPos += object.state.changeY;
}
// end enemy }}}
// start handling {{{
function handleProjectileHit(object, projectilesCanHurt) {
    const projectileHit = objectHitByProjectile(object, projectilesCanHurt);
    if (projectileHit) {
        object.state.hurtSFX.play();
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
        if (GAME_CONFIG_DISPLAY_HITBOX) drawHitbox(object, "green");
        ctx.drawImage(
            gameTextures[PLAYER_TEXTURE],
            object.xPos + PLAYER_CONFIG_TEXTURE_OFFSET_X,
            object.yPos + PLAYER_CONFIG_TEXTURE_OFFSET_Y,
            PLAYER_CONFIG_TEXTURE_WIDTH,
            PLAYER_CONFIG_TEXTURE_HEIGHT
        );
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
        gameLost = true;
    }
}
function handleMainEnemyAttacks(object) {
    if (!object.state.circleAttack) object.state.circleAttack = {};
    if (!object.state.circleAttack.delay) object.state.circleAttack.delay = 0;
    if (object.state.circleAttack.delay > 40) {
        circleAttack(object);
        object.state.circleAttack.delay = 0;
    }
    object.state.circleAttack.delay += 1;
}
function handleMainEnemyLife(object) {
    // enemyMovementHorizontally(mainEnemy);
    // enemyMovementRandomConstant(object, 120, 50);
    enemyMovementRandomVaried(object, 50, ENEMY_CONFIG_SPEED);
    if (GAME_CONFIG_PLAYERPROJECTILES) {
        handleProjectileHit(object, playerProjectiles);
    } else {
        object.hp -= PLAYER_CONFIG_DAMAGE;
    }
    if (object.hp > 0) {
        ctx.drawImage(
            gameTextures[ENEMY_TEXTURE],
            object.xPos + ENEMY_CONFIG_TEXTURE_OFFSET_X,
            object.yPos + ENEMY_CONFIG_TEXTURE_OFFSET_Y,
            ENEMY_CONFIG_TEXTURE_WIDTH,
            ENEMY_CONFIG_TEXTURE_HEIGHT
        );
        handleMainEnemyAttacks(object);
        drawHealthBar(
            ENEMY_HEALTHBAR_X,
            ENEMY_HEALTHBAR_Y,
            ENEMY_HEALTHBAR_W,
            ENEMY_HEALTHBAR_H,
            ENEMY_CONFIG_HEALTH,
            mainEnemy.hp,
        );
    } else {
        gameRunning = false;
        gameLost = false;
    }
}
function handleKeyPresses(keyspressed) {
    let movement = null;
    if (keyspressed.w || keyspressed.ArrowUp) {
        movement = player.yPos + -PLAYER_CONFIG_SPEED * deltaTime;
        if (movement >= 0) player.yPos = movement;
    }
    if (keyspressed.a || keyspressed.ArrowLeft) {
        movement = player.xPos + -PLAYER_CONFIG_SPEED * deltaTime;
        if (movement >= 0) player.xPos = movement;
    }
    if (keyspressed.s || keyspressed.ArrowDown) {
        movement = player.yPos + PLAYER_CONFIG_SPEED * deltaTime;
        if (movement <= canvas.height - PLAYER_CONFIG_HEIGHT) player.yPos = movement;
    }
    if (keyspressed.d || keyspressed.ArrowRight) {
        movement = player.xPos + PLAYER_CONFIG_SPEED * deltaTime;
        if (movement <= canvas.width - PLAYER_CONFIG_WIDTH) player.xPos = movement;
    }
}
// end handling }}}
function updateGame(renderTimestamp) {
    if (!lastTimestamp) lastTimestamp = renderTimestamp;
    deltaTime = (renderTimestamp - lastTimestamp) / GAME_CONFIG_DELTATIME_MODIFIER;
    lastTimestamp = renderTimestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.3);
    handleKeyPresses(inputKeysPressed);
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
    if (gameRunning) { window.requestAnimationFrame(updateGame); }
    else {
        if (gameLost) {
            deathscreendiv.style.animation = "fade-out 0.5s ease 0s forwards";
            deathscreentext.style.animation = "fade-out 0.5s ease 0s forwards";
            deathscreenbutton.style.animation = "fade-out 0.5s ease 0s forwards";
        } else {
            winscreendiv.style.animation = "fade-out 0.5s ease 0s forwards";
            winscreentext.style.animation = "fade-out 0.5s ease 0s forwards";
            winscreenbutton.style.animation = "fade-out 0.5s ease 0s forwards";
        }
    }
}

// start game-variables {{{
let player = createPlayerObject();
let mainEnemy = createEnemyObject();
let enemyProjectiles = [];
let playerProjectiles = [];
let objectHitSplashTexts = [];
let inputKeysPressed = {};
let deltaTime = null;
let lastTimestamp = null;
let gameRunning = false;
let gameLost = true;
let firstGame = true;
function startGame() {
    if (gameLost) {
        deathscreendiv.style.animation = "fade-in 2s ease 1s forwards";
        if (!firstGame) {
            deathscreentext.style.animation = "fade-in 0.2s ease 0s forwards";
            deathscreenbutton.style.animation = "fade-in 0.2s ease 0s forwards";
        } else {
            firstGame = false;
            deathscreentext.style.animation = "fade-in 0s ease 0s forwards";
            deathscreenbutton.style.animation = "fade-in 0s ease 0s forwards";
        }
    } else {
        winscreendiv.style.animation = "fade-in 2s ease 1s forwards";
        winscreentext.style.animation = "fade-in 0.2s ease 0s forwards";
        winscreenbutton.style.animation = "fade-in 0.2s ease 0s forwards";
    }
    player = createPlayerObject();
    mainEnemy = createEnemyObject();
    enemyProjectiles = [];
    playerProjectiles = [];
    objectHitSplashTexts = [];
    inputKeysPressed = {};
    deltaTime = null;
    lastTimestamp = null;
    gameRunning = true;
    window.requestAnimationFrame(updateGame);
}
// end game-variables }}}
// start player-movement-event-listeners {{{
document.addEventListener("keydown", (event) => {
    inputKeysPressed[event.key] = true;
});
document.addEventListener("keyup", (event) => {
    inputKeysPressed[event.key] = false;
});
// end player-movement-event-listeners }}}
// start restart-game-event-listener {{{
document.addEventListener("keydown", (event) => {
    console.log(event.key);
    if (event.key === "h") gameRunning = false;
});
deathscreenbutton.addEventListener("click", (event) => {
    deathscreendiv.style.visibility = "visible";
    deathscreendiv.style.opacity = 1;
    startGame();
});
winscreenbutton.addEventListener("click", (event) => {
    winscreendiv.style.visibility = "visible";
    winscreendiv.style.opacity = 1;
    startGame();
});
// end restart-game-event-listener }}}

