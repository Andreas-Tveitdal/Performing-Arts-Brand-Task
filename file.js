
const canvas = {
    width: 100,
    height: 100,
};

// start config {{{
const GAMECONFIG = {
    MAX_PROJECTILE_COUNT: 10000,
    SPLASHTEXT: {
        COLOR: "orange",
        DURATION: 30,
    },
    PLAYERPROJECTILES: true,
    DISPLAY_HITBOX: false,
    DELTATIME_MODIFIER: 10,
};

const PLAYER = {
    TEXTURE: "gigantus_55x61.png",
    CONFIG: {
        HEALTH: 14,
        SPEED: 2.5,
        DAMAGE: 20,
        WIDTH: 50,
        HEIGHT: 50,
        TEXTURE: {
            WIDTH: 53,
            HEIGHT: 59,
            OFFSET: {
                X: -3,
                Y: -4,
            },
        },
    },
};
PLAYER.START = {
    X: (canvas.width - PLAYER.CONFIG.WIDTH) / 2,
    Y: (canvas.height - PLAYER.CONFIG.HEIGHT) / 2,
};
PLAYER.PROJECTILE = {
    COUNT: 2,
    SPACING: 15,
    WIDTH: 9,
    HEIGHT: 9,
    OFFSET: {
        X: PLAYER.CONFIG.WIDTH / 2,
        Y: -10,
    },
    COOLDOWN: 4,
    SPEED: 10,
};
PLAYER.HEALTHBAR = {
    X: canvas.width / 20,
    Y: canvas.height - canvas.height / 30,
    W: canvas.width / 4,
    H: canvas.height / 100,
}

const SLIME = {
    TEXTURE: "enemy_42x30.png",
    CONFIG: {
        HEALTH: 10000,
        SPEED: 2,
        DAMAGE: 1,
        WIDTH: 50,
        HEIGHT: 50,
        TEXTURE: {
            WIDTH: 53,
            HEIGHT: 59,
            OFFSET: {
                X: -3,
                Y: -4,
            },
        },
    },
};
SLIME.START = {
    X: (canvas.width - SLIME.CONFIG.WIDTH) / 2,
    Y: (canvas.height - SLIME.CONFIG.HEIGHT) / 10,
};
SLIME.PROJECTILE = {
    WIDTH: 9,
    HEIGHT: 9,
    OFFSET: {
        X: SLIME.CONFIG.WIDTH / 2,
        Y: -10,
    },
    COOLDOWN: 3,
    SPEED: 3,
};
SLIME.HEALTHBAR = {
    X: canvas.width / 20,
    Y: canvas.height / 50,
    W: canvas.width - canvas.width / 10,
    H: canvas.height / 150,
};
// end config }}}
