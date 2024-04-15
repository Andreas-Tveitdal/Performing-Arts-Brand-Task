// "use strict";

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
const playerHurtSFX = new Audio("./hurtSFX.wav");
const playerHitSFX = new Audio("./hitSFX.wav");
const playerWinSFX = new Audio("./winSFX.wav");
const playerLoseSFX = new Audio("./loseSFX.wav");
const backgroundAudioFantasy = new Audio("./background_fantasy.wav");
const backgroundAudioChiptune = new Audio("./background_chiptune.wav");
const gameAudio = backgroundAudioChiptune;
let audioState = 10;
const audioOptions = [ 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1 ];
gameAudio.addEventListener("ended", function() {
    this.currentTime = 0;
    this.play();
});
// end initialization }}}

// TODO: CREATE A WAY TO IMPLEMENT STATE ON OBJECTS EASIER
// TODO: MAKE NEW IMPLEMENTATION OF OBJECT DRAWING
// TODO: CHANGE HOW A RANDOM ATTACK IS CHOSEN
// TODO: CHANGE HOW A RANDOM MOVEMENT PATTERN IS CHOSEN


// start config {{{
const GAMECONFIG_MAX_PROJECTILECOUNT = 10000;
const GAMECONFIG_SPLASHTEXT_DURATION = 30;
const GAMECONFIG_PLAYERPROJECTILES = true;
const GAMECONFIG_DELTATIME_MODIFIER = 10;
const GAMECONFIG_DISPLAY_HITBOX = false;

const PLAYER_CONFIG_HEALTH = 14;
const PLAYER_CONFIG_SPEED = 2.5;
const PLAYER_CONFIG_DAMAGE = 20;
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
const PLAYER_PROJECTILE_WIDTH = 9;
const PLAYER_PROJECTILE_HEIGHT = 9;
const PLAYER_PROJECTILE_OFFSET_X = PLAYER_CONFIG_WIDTH / 2;
const PLAYER_PROJECTILE_OFFSET_Y = eval("-PLAYER_CONFIG_HEIGHT / 10;");
const PLAYER_PROJECTILE_COOLDOWN = 4;
const PLAYER_PROJECTILE_SPEED = 5;
const PLAYER_HEALTHBAR_X = canvas.width / 20;
const PLAYER_HEALTHBAR_Y = canvas.height - canvas.height / 30;
const PLAYER_HEALTHBAR_W = canvas.width / 4;
const PLAYER_HEALTHBAR_H = canvas.height / 100;

const SLIME_CONFIG_HEALTH = 10000;
const SLIME_CONFIG_SPEED = 2;
const SLIME_CONFIG_DAMAGE = 1;
const SLIME_CONFIG_WIDTH = 50;
const SLIME_CONFIG_HEIGHT = 50;
const SLIME_CONFIG_TEXTURE_WIDTH = 53;
const SLIME_CONFIG_TEXTURE_HEIGHT = 59;
const SLIME_CONFIG_TEXTURE_OFFSET_X = -3;
const SLIME_CONFIG_TEXTURE_OFFSET_Y = -4;
const SLIME_TEXTURE = "enemies_slime_42x30.png";
const SLIME_START_X = (canvas.width - SLIME_CONFIG_WIDTH) / 2;
const SLIME_START_Y = (canvas.width - SLIME_CONFIG_HEIGHT) / 10;
const SLIME_PROJECTILE_WIDTH = 9;
const SLIME_PROJECTILE_HEIGHT = 9;
const SLIME_PROJECTILE_OFFSET_X = SLIME_CONFIG_WIDTH / 2;
const SLIME_PROJECTILE_OFFSET_Y = -10;
const SLIME_PROJECTILE_COOLDOWN = 3;
const SLIME_PROJECTILE_SPEED = 3;
const SLIME_HEALTHBAR_X = canvas.width / 20;
const SLIME_HEALTHBAR_Y = canvas.height / 50;
const SLIME_HEALTHBAR_W = canvas.width - 2 * SLIME_HEALTHBAR_X;
const SLIME_HEALTHBAR_H = canvas.height / 150;
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
        xPos: SLIME_START_X,
        yPos: SLIME_START_Y,
        width: SLIME_CONFIG_WIDTH,
        height: SLIME_CONFIG_HEIGHT,
        hp: SLIME_CONFIG_HEALTH,
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
        const texture = projectileList.texture;
        for (const projectile of projectileList) {
            for (const updateFunction of updateFunctionList) {
                updateFunction(projectile, projectileList, deltaTime, texture);
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
            object.xPos + PLAYER_PROJECTILE_OFFSET_X + (-(PLAYER_PROJECTILE_COUNT - 1) / 2 + i) * PLAYER_PROJECTILE_SPACING,
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
function drawObject(object, texture, xOffset, yOffset) {
    if (GAMECONFIG_DISPLAY_HITBOX) drawHitbox(object, "green");
    ctx.drawImage(
        gameTextures[texture],
        object.xPos + xOffset,
        object.yPos + yOffset,
        object.width,
        object.height
    );
}
function drawProjectiles(projectile, _, __, textureName) {
    ctx.drawImage(
        gameTextures[textureName],
        projectile.xPos - projectile.width / 2,
        projectile.yPos - projectile.height / 2,
        projectile.width,
        projectile.height
    );
}
// end drawing-methods }}}
// start enemy {{{
function weirdEnemyAttack(object) {
    if (!object.state.spinAttack) object.state.spinAttack = {};
    if (!object.state.spinAttack.currentAngle) object.state.spinAttack.currentAngle = 0;
    enemyProjectiles.push(createPolarProjectile(
        object.xPos + object.width / 2,
        object.yPos + object.height / 2,
        SLIME_PROJECTILE_WIDTH,
        SLIME_PROJECTILE_HEIGHT,
        object.state.spinAttack.currentAngle,
        SLIME_PROJECTILE_SPEED,
        SLIME_CONFIG_DAMAGE
    ));
    object.state.spinAttack.currentAngle += 1;
}
function circleAttack(object) {
    for (let i = 0; i < 360; i += 20) {
        enemyProjectiles.push(createPolarProjectile(
            object.xPos + object.width / 2,
            object.yPos + object.height / 2,
            SLIME_PROJECTILE_WIDTH,
            SLIME_PROJECTILE_HEIGHT,
            i,
            SLIME_PROJECTILE_SPEED,
            SLIME_CONFIG_DAMAGE
        ));
    }
}
function spreadAttack(object) {
    
    const playerAngle = Math.atan2(player.yPos - object.yPos, player.xPos - object.xPos) * 180 / Math.PI
    for (let i = playerAngle - 45; i <= playerAngle + 45; i += 10) {
        enemyProjectiles.push(createPolarProjectile(
            object.xPos + object.width / 2,
            object.yPos + object.height / 2,
            SLIME_PROJECTILE_WIDTH,
            SLIME_PROJECTILE_HEIGHT,
            i,
            SLIME_PROJECTILE_SPEED,
            SLIME_CONFIG_DAMAGE
        ));
    }
}
function enemyMovementHorizontally(object) {
    if (!object.state.changeX) object.state.changeX = SLIME_CONFIG_SPEED * deltaTime;
    if (object.xPos > canvas.width * 0.8) {
        object.state.changeX = -SLIME_CONFIG_SPEED;
    } else if (object.xPos < canvas.width * 0.2) {
        object.state.changeX = SLIME_CONFIG_SPEED;
    }
    object.xPos += object.state.changeX;
}
function enemyMovementRandomConstant(object, time, delay) {
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
function enemyMovementRandomMax(object, time, delay) {
    if (!object.state.randomMoveGoalDelay) object.state.randomMoveGoalDelay = 0;
    if (!object.state.changeX || !object.state.changeY) {
        object.state.changeX = null;
        object.state.changeY = null;
    }
    const LIMX = canvas.width * 0.9;
    const LIMY = canvas.height * 0.4;
    const MINX = canvas.width * 0.1;
    const MINY = canvas.height * 0.1; 
    const MOVEMAX = 5;
    const MOVEMIN = -5;
    function setChange() {
        const randX = Math.random();
        const randY = Math.random();
        xTarget = randX * (LIMX - MINX) + MINX - object.xPos;
        yTarget = randY * (LIMY - MINY) + MINY - object.yPos;
        xTarget /= time;
        yTarget /= time;
        if (xTarget < MOVEMIN) { object.state.changeX = MOVEMIN; }
        else if (xTarget > MOVEMAX) { object.state.changeX = MOVEMAX; }
        else { object.state.changeX = xTarget; }
        if (yTarget < MOVEMIN) { object.state.changeY = MOVEMIN; }
        else if (yTarget > MOVEMAX) { object.state.changeY = MOVEMAX; }
        else { object.state.changeY = yTarget; }
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
            timeLeft: GAMECONFIG_SPLASHTEXT_DURATION
        });
        object.hp -= projectileHit.damage;
        removeFromList(projectileHit, projectilesCanHurt);
    }
}
function handlePlayerLife(object) {
    handleProjectileHit(object, enemyProjectiles);
    if (object.hp > 0) { 
        drawObject(object, PLAYER_TEXTURE, PLAYER_CONFIG_TEXTURE_OFFSET_X, PLAYER_CONFIG_TEXTURE_OFFSET_Y);
        if (GAMECONFIG_PLAYERPROJECTILES) playerInstantiateProjectiles(player);
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
    // TODO: CHANGE HOW A RANDOM ATTACK IS CHOSEN
    const randomAttackMethod = () => {
        const methods = [
            () => {spreadAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
            () => {circleAttack(object);},
        ];
        const methodIndex = Math.round(Math.random() * 18);
        return methods[methodIndex];
    };
    if (!object.state.attackMethodDelay) object.state.attackMethodDelay = 0;
    if (!object.state.attackMethod) object.state.attackMethod = randomAttackMethod();
    if (object.state.attackMethodDelay >= 40) {
        object.state.attackMethod = randomAttackMethod();
        object.state.attackMethod();
        object.state.attackMethodDelay = 0;
    }
    object.state.attackMethodDelay += 1;
}
function handleMainEnemyLife(object) {
    // TODO: CHANGE HOW RANDOM MOVEMENT IS CHOSEN
    const randomMoveMethod = () => {
        const methods = [
            () => {enemyMovementRandomConstant(object, 120, 50);},
            () => {enemyMovementRandomMax(object, 120, 50);},
            () => {enemyMovementHorizontally(mainEnemy);},
            () => {enemyMovementRandomVaried(object, 50, SLIME_CONFIG_SPEED);},
        ];
        const methodIndex = Math.round(Math.random() * 3);
        return methods[methodIndex];
    };
    if (!object.state.moveMethodDelay) object.state.moveMethodDelay = 0;
    if (!object.state.moveMethod) object.state.moveMethod = randomMoveMethod();
    if (object.state.moveMethodDelay >= 600) {
        object.state.moveMethod = randomMoveMethod();
        object.state.moveMethodDelay = 0;
    }
    object.state.moveMethodDelay += 1;
    object.state.moveMethod();
     
    if (GAMECONFIG_PLAYERPROJECTILES) {
        handleProjectileHit(object, playerProjectiles);
    } else {
        object.hp -= PLAYER_CONFIG_DAMAGE;
    }
    if (object.hp > 0) {
        drawObject(object, SLIME_TEXTURE, SLIME_CONFIG_TEXTURE_OFFSET_X, SLIME_CONFIG_TEXTURE_OFFSET_Y);
        handleMainEnemyAttacks(object);
        drawHealthBar(
            SLIME_HEALTHBAR_X,
            SLIME_HEALTHBAR_Y,
            SLIME_HEALTHBAR_W,
            SLIME_HEALTHBAR_H,
            SLIME_CONFIG_HEALTH,
            mainEnemy.hp,
        );
    } else {
        gameRunning = false;
        gameLost = false;
    }
}
function handleKeyPresses(keyspressed) {
    let movement = null;
    // console.log(keyspressed);
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
    deltaTime = (renderTimestamp - lastTimestamp) / GAMECONFIG_DELTATIME_MODIFIER;
    lastTimestamp = renderTimestamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        gameAudio.pause();
        if (gameLost) {
            playerLoseSFX.play();
            deathscreendiv.style.animation = "fade-out 0.5s ease 0s forwards";
            deathscreentext.style.animation = "fade-out 0.5s ease 0s forwards";
            deathscreenbutton.style.animation = "fade-out 0.5s ease 0s forwards";
        } else {
            playerWinSFX.play();
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
    gameAudio.play();
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
    enemyProjectiles.texture = "projectile_red_9x9.png";
    playerProjectiles = [];
    playerProjectiles.texture = "projectile_green_9x9.png";
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
    switch (event.key) {
        case "h":
            gameLost = true;
            gameRunning = false;
            break;
        case "m":
            if (audioState < 10) {
                audioState += 1;
                gameAudio.volume = audioOptions[audioState];
            }
            break;
        case "n":
            if (audioState > 0) {
                audioState -= 1;
                gameAudio.volume = audioOptions[audioState];
            }
            break;
    }
    inputKeysPressed[event.key] = true;
});
document.addEventListener("keyup", (event) => {
    inputKeysPressed[event.key] = false;
});
// end player-movement-event-listeners }}}
// start restart-game-event-listener {{{
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

