console.log(gsap);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const modalEl = document.getElementById("modal");
const modalScoreEl = document.getElementById("modalScore");
const scoreEl = document.getElementById("points");
const startGameBtnEl = document.getElementById("startGameBtn");

const shipRadius = 15;
const playerMovementSpeed = 5;
const bulletMovementSpeed = 7;
const firingInterval = 100;
const particleSpeed = 7;
const friction = 0.98;

let animationId
let playGame = false;
let score = 0;
let ableToFire = true;
setInterval(() => { ableToFire = true }, firingInterval);
let playerCenter = { x: canvas.width / 2, y: canvas.height / 2 }
let controllerIndex = null;
let playerVelocity = { x: 0, y: 0 };
let bulletTrajectory = { x: 0, y: 0 };



// BEGIN GAMEPAD FUNCTIONALITY
window.addEventListener("gamepadconnected", (event) => {
    handleConnectDisconnect(event, true);
});

window.addEventListener("gamepaddisconnected", (event) => {
    handleConnectDisconnect(event, false);
});

function handleConnectDisconnect(event, connected) {
    const gamepad = event.gamepad;
    console.log(gamepad);

    if (connected) {
        controllerIndex = gamepad.index;
    } else {
        controllerIndex = null;
    }
};

function handleButtons(buttons) {
    if (buttons[0].pressed) {
        playGame = true;
        updateScore(0);
        modalEl.style.display = 'none';
    }
}

// This function determines the movement of the player and where to fire bullets
function handleSticks(axes) {
    if ([axes[0], axes[1]].some(axis => axis > .2 || axis < -.2)) {
        playerVelocity = { x: axes[0] * playerMovementSpeed, y: axes[1] * playerMovementSpeed };
    }
    else {
        playerVelocity = { x: 0, y: 0 }
    }
    if ([axes[2], axes[3]].some(axis => axis > .2 || axis < -.2)) {
        const angle = Math.atan2(axes[3], axes[2]);
        bulletTrajectory = {
            // Will yield a result that is in the range -1 to 1
            x: Math.cos(angle) * bulletMovementSpeed,
            y: Math.sin(angle) * bulletMovementSpeed
        }
        if (ableToFire && playGame) {
            ableToFire = false;
            projectiles.push(new Projectile(5, 'white', bulletTrajectory));
        }
    }
};

// function handleRumble(gamepad) {
//     const rumbleOnButtonPress = document.getElementById("rumble-on-button-press");

//     if (rumbleOnButtonPress.checked) {
//         if (gamepad.buttons.some(button => button.value > 0)) {
//             gamepad.vibrationActuator.playEffect("dual-rumble", {
//                 startDelay: 0,
//                 duration: 25,
//                 weakMagnitude: 1.0,
//                 strongMagnitude: 1.0,
//             });
//         }
//     }
// };

// END GAMEPAD FUNCTIONALITY



// PLAYER CLASS
class Player {
    constructor(origin, radius, color) {
        this.x = origin.x
        this.y = origin.y
        this.radius = radius
        this.color = color
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        if (playGame) {
            this.draw();
            this.x = this.x + playerVelocity.x;
            this.y = this.y + playerVelocity.y;
            playerCenter = {
                x: this.x,
                y: this.y
            }
        }
    }
}



// PROJECTILE CLASS
class Projectile {
    constructor(radius, color, velocity) {
        this.x = playerCenter.x
        this.y = playerCenter.y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        if (playGame) {
            this.draw();
            this.x = this.x + this.velocity.x;
            this.y = this.y + this.velocity.y;
        }
    }
}



// ENEMY CLASS
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    updateVelocity() {
        // When determining the angle for two points always subtract from the destination
        const angle = Math.atan2(playerCenter.y - this.y, playerCenter.x - this.x);
        const velocity = {
            // Will yield a result that is in the range -1 to 1
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        this.velocity = velocity;
    }

    updateVelocity() {
        // When determining the angle for two points always subtract from the destination
        const angle = Math.atan2(playerCenter.y - this.y, playerCenter.x - this.x);
        const velocity = {
            // Will yield a result that is in the range -1 to 1
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        this.velocity = velocity;
    }

    update() {
        if (playGame) {
            this.draw();
            this.updateVelocity();
            this.x = this.x + this.velocity.x;
            this.y = this.y + this.velocity.y;
        }
    }
}



// PARTICLE CLASS
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (playGame) {
            this.draw();
            this.velocity.x *= friction;
            this.velocity.y *= friction;
            this.x = this.x + this.velocity.x;
            this.y = this.y + this.velocity.y;
            this.alpha -= 0.01;
        }
    }
}



const x = canvas.width / 2;
const y = canvas.height / 2;

const player = new Player(playerCenter, shipRadius, 'white');
player.draw();

const projectiles = [];
const enemies = [];
const particles = [];

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (30 - 10) + 10;

        let x;
        let y;

        if (Math.random() < 0.5) {
            x = Math.random() < .5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < .5 ? 0 - radius : canvas.height + radius;
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const angle = Math.atan2(playerCenter.y - y, playerCenter.x - x);
        const velocity = {
            // Will yield a result that is in the range -1 to 1
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
};

function updateScore(newScore) {
    score = newScore;
    scoreEl.textContent = newScore.toString();
    modalScoreEl.textContent = newScore.toString();
};

function resetGame() {
    playGame = false;
    modalEl.style.display = 'flex';
    while (projectiles.length > 0) {
        projectiles.pop();
    };
    while (enemies.length > 0) {
        enemies.pop();
    };
    while (particles.length > 0) {
        particles.pop();
    };
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
};

function gameLoop() {
    if (controllerIndex !== null) {
        const gamepad = navigator.getGamepads()[controllerIndex];
        handleButtons(gamepad.buttons);
        handleSticks(gamepad.axes);
        // handleRumble(gamepad);
    }
    animationId = requestAnimationFrame(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.update();

    // Render all particles
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        };
    })

    // Render all projectiles
    projectiles.forEach((projectile, index) => {
        projectile.update();

        // Remove projectiles that have left the canvas
        if (projectile.x + projectile.radius < 0 || projectile.x - projectile.radius > canvas.width || projectile.y + projectile.radius < 0 || projectile.y - projectile.radius > canvas.height) {
            // This timeout causes the enemy to be removed one fram later to eliminate a stutter in the animation of other enemies
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }
    })

    // Render all enemies
    enemies.forEach((enemy, index) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            console.log("Game Over!");
            resetGame();
        };

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // When Projectile touches enemies
            if (dist - enemy.radius - projectile.radius < 1) {
                // Create explosions
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, { x: (Math.random() - 0.5) * (Math.random() * particleSpeed), y: (Math.random() - 0.5) * (Math.random() * particleSpeed) }))
                }

                if (enemy.radius - 10 > 5) {
                    // Increase score
                    updateScore(score + 100);

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    // enemy.radius = Math.max(10, enemy.radius - 5);
                    projectiles.splice(projectileIndex, 1)
                } else {
                    // Increase score more for killed enemy
                    updateScore(score + 250);

                    // This timeout causes the enemy to be removed one fram later to eliminate a stutter in the animation of other enemies
                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                }
            }
        })
    })
}

// window.addEventListener('click', (event) => {
//     const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
//     const velocity = {
//         // Will yield a result that is in the range -1 to 1
//         x: Math.cos(angle),
//         y: Math.sin(angle)
//     }
//     projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity));
// })

gameLoop();
spawnEnemies();

startGameBtnEl.addEventListener("click", () => {
    modalEl.style.display = 'none';
    updateScore(0);
    playGame = true;
})