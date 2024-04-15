
const gameTextures = {};
const sourceImages = [
    "bombastus_1280x960.png",
    "bombastus_55x57.png",
    "enemies_slime_3200x2400.jpg",
    "enemies_slime_42x30.png",
    "gigantus_3200x2400.jpg",
    "gigantus_53x59.png",
    "gigantus_64x48.png",
    "gigantus_55x61.png",
    "projectile_red_5x5.png",
    "projectile_red_9x9.png",
    "projectile_blue_9x9.png",
    "projectile_green_9x9.png",
];

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

