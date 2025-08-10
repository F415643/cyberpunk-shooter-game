// 游戏变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreSpan = document.getElementById('finalScore');
const finalLevelSpan = document.getElementById('finalLevel');

// 设置画布大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 游戏状态
let gameRunning = false;
let gameStarted = false;
let score = 0;
let level = 1;
let playerCollisionCount = 0;
let gameSpeed = 1;

// 玩家对象
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 30,
    height: 30,
    speed: 5,
    health: 100,
    color: '#0ff',
    isFlashing: false,
    flashTimer: 0,
    flashDuration: 60
};

// 游戏对象数组
let bullets = [];
let enemies = [];
let particles = [];
let powerUps = [];
let bosses = [];

// 键盘状态
const keys = {};

// 事件监听
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' && !gameStarted) {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// 鼠标控制
canvas.addEventListener('mousemove', (e) => {
    if (gameRunning) {
        const rect = canvas.getBoundingClientRect();
        player.x = e.clientX - rect.left - player.width / 2;
        player.y = e.clientY - rect.top - player.height / 2;
    }
});

canvas.addEventListener('click', (e) => {
    if (gameRunning) {
        shoot();
    }
});

// 开始游戏
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        gameRunning = true;
        score = 0;
        level = 1;
        playerCollisionCount = 0;
        gameSpeed = 1;
        
        // 重置游戏对象
        bullets = [];
        enemies = [];
        particles = [];
        powerUps = [];
        bosses = [];
        
        // 重置玩家位置
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
        player.isFlashing = false;
        player.flashTimer = 0;
        
        // 隐藏游戏结束界面
        gameOverDiv.style.display = 'none';
        
        // 开始游戏循环
        gameLoop();
    }
}

// 射击函数
function shoot() {
    const bullet = {
        x: player.x + player.width / 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 10,
        color: '#0ff',
        damage: 10
    };
    bullets.push(bullet);
}

// 创建敌人
function createEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 2 + Math.random() * 2 * gameSpeed,
        health: 20 + level * 5,
        color: '#f0f',
        type: 'normal'
    };
    enemies.push(enemy);
}

// 创建Boss
function createBoss() {
    const boss = {
        x: canvas.width / 2 - 50,
        y: -100,
        width: 100,
        height: 100,
        speed: 1 + level * 0.2,
        health: 200 + level * 50,
        maxHealth: 200 + level * 50,
        color: '#ff0',
        phase: 1,
        attackTimer: 0,
        attackInterval: 60,
        bulletPattern: 0
    };
    bosses.push(boss);
}

// 创建粒子效果
function createParticles(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 4 + 2,
            color: color,
            life: 30,
            maxLife: 30
        };
        particles.push(particle);
    }
}

// 创建道具
function createPowerUp(x, y) {
    const powerUp = {
        x: x,
        y: y,
        width: 20,
        height: 20,
        speed: 2,
        type: Math.random() < 0.5 ? 'health' : 'weapon',
        color: Math.random() < 0.5 ? '#0f0' : '#ff0'
    };
    powerUps.push(powerUp);
}

// 碰撞检测
function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 更新游戏对象
function update() {
    if (!gameRunning) return;

    // 更新玩家
    if (keys['a'] || keys['arrowleft']) player.x -= player.speed;
    if (keys['d'] || keys['arrowright']) player.x += player.speed;
    if (keys['w'] || keys['arrowup']) player.y -= player.speed;
    if (keys['s'] || keys['arrowdown']) player.y += player.speed;

    // 限制玩家在画布内
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // 更新闪烁状态
    if (player.isFlashing) {
        player.flashTimer--;
        if (player.flashTimer <= 0) {
            player.isFlashing = false;
        }
    }

    // 更新子弹
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });

    // 更新敌人
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });

    // 更新Boss
    bosses.forEach((boss, bossIndex) => {
        boss.y += boss.speed;
        
        // Boss攻击
        boss.attackTimer++;
        if (boss.attackTimer >= boss.attackInterval) {
            boss.attackTimer = 0;
            
            // 根据阶段使用不同的攻击模式
            if (boss.phase === 1) {
                // 直线射击
                const bullet = {
                    x: boss.x + boss.width / 2,
                    y: boss.y + boss.height,
                    width: 6,
                    height: 12,
                    speed: 5,
                    color: '#ff0',
                    damage: 20,
                    isEnemyBullet: true
                };
                bullets.push(bullet);
            } else if (boss.phase === 2) {
                // 扇形射击
                for (let i = 0; i < 3; i++) {
                    const bullet = {
                        x: boss.x + boss.width / 2,
                        y: boss.y + boss.height,
                        width: 6,
                        height: 12,
                        speed: 4,
                        color: '#ff0',
                        damage: 15,
                        isEnemyBullet: true,
                        vx: (i - 1) * 2,
                        vy: 4
                    };
                    bullets.push(bullet);
                }
            }
        }

        if (boss.y > canvas.height) {
            bosses.splice(bossIndex, 1);
        }
    });

    // 更新粒子
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });

    // 更新道具
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.speed;
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });

    // 碰撞检测
    // 子弹与敌人
    bullets.forEach((bullet, bulletIndex) => {
        if (bullet.isEnemyBullet) return;
        
        enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(bullet, enemy)) {
                enemy.health -= bullet.damage;
                bullets.splice(bulletIndex, 1);
                
                if (enemy.health <= 0) {
                    createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#f0f', 8);
                    enemies.splice(enemyIndex, 1);
                    score += 10;
                    
                    // 随机掉落道具
                    if (Math.random() < 0.1) {
                        createPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    }
                }
            }
        });

        // 子弹与Boss
        bosses.forEach((boss, bossIndex) => {
            if (isColliding(bullet, boss)) {
                boss.health -= bullet.damage;
                bullets.splice(bulletIndex, 1);
                
                if (boss.health <= 0) {
                    createParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, '#ff0', 15);
                    bosses.splice(bossIndex, 1);
                    score += 100 * level;
                    level++;
                    gameSpeed += 0.2;
                } else if (boss.health <= boss.maxHealth / 2 && boss.phase === 1) {
                    boss.phase = 2;
                    boss.attackInterval = 40;
                }
            }
        });
    });

    // 敌人与玩家
    enemies.forEach((enemy, index) => {
        if (isColliding(enemy, player) && !player.isFlashing) {
            playerCollisionCount++;
            player.isFlashing = true;
            player.flashTimer = player.flashDuration;
            
            createParticles(player.x + player.width / 2, player.y + player.height / 2, '#0ff', 5);
            
            if (playerCollisionCount >= 3) {
                gameOver();
            }
        }
    });

    // Boss与玩家
    bosses.forEach((boss, index) => {
        if (isColliding(boss, player) && !player.isFlashing) {
            playerCollisionCount += 2;
            player.isFlashing = true;
            player.flashTimer = player.flashDuration;
            
            createParticles(player.x + player.width / 2, player.y + player.height / 2, '#0ff', 8);
            
            if (playerCollisionCount >= 3) {
                gameOver();
            }
        }
    });

    // 敌人子弹与玩家
    bullets.forEach((bullet, index) => {
        if (bullet.isEnemyBullet && isColliding(bullet, player) && !player.isFlashing) {
            playerCollisionCount++;
            player.isFlashing = true;
            player.flashTimer = player.flashDuration;
            
            bullets.splice(index, 1);
            createParticles(player.x + player.width / 2, player.y + player.height / 2, '#0ff', 5);
            
            if (playerCollisionCount >= 3) {
                gameOver();
            }
        }
    });

    // 道具与玩家
    powerUps.forEach((powerUp, index) => {
        if (isColliding(powerUp, player)) {
            if (powerUp.type === 'health') {
                playerCollisionCount = Math.max(0, playerCollisionCount - 1);
            } else if (powerUp.type === 'weapon') {
                // 武器升级逻辑
                score += 50;
            }
            
            powerUps.splice(index, 1);
            createParticles(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.color, 5);
        }
    });

    // 生成敌人
    if (Math.random() < 0.02 * gameSpeed) {
        createEnemy();
    }

    // 生成Boss
    if (bosses.length === 0 && Math.random() < 0.005 * level) {
        createBoss();
    }

    // 更新UI
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('health').textContent = Math.max(0, 3 - playerCollisionCount);
}

// 渲染函数
function draw() {
    // 清空画布
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制玩家
    if (!player.isFlashing || Math.floor(player.flashTimer / 5) % 2 === 0) {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // 玩家轮廓
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x, player.y, player.width, player.height);
    }

    // 绘制子弹
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        
        // 子弹光晕
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    });

    // 绘制敌人
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // 敌人轮廓
        ctx.strokeStyle = '#f0f';
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // 绘制Boss
    bosses.forEach(boss => {
        // Boss主体
        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        
        // Boss轮廓
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.strokeRect(boss.x, boss.y, boss.width, boss.height);
        
        // Boss血条
        const healthBarWidth = boss.width;
        const healthBarHeight = 8;
        const healthPercent = boss.health / boss.maxHealth;
        
        ctx.fillStyle = '#f00';
        ctx.fillRect(boss.x, boss.y - 15, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = '#0f0';
        ctx.fillRect(boss.x, boss.y - 15, healthBarWidth * healthPercent, healthBarHeight);
    });

    // 绘制粒子
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;

    // 绘制道具
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
        // 道具光晕
        ctx.shadowColor = powerUp.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        ctx.shadowBlur = 0;
    });

    // 绘制开始提示
    if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0ff';
        ctx.font = '48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('赛博朋克射击游戏', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = '24px Courier New';
        ctx.fillText('点击鼠标或按空格键开始', canvas.width / 2, canvas.height / 2 + 50);
        ctx.textAlign = 'left';
    }
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    finalScoreSpan.textContent = score;
    finalLevelSpan.textContent = level;
    gameOverDiv.style.display = 'block';
    
    // 3秒后自动关闭页面
    setTimeout(() => {
        window.close();
        // 如果window.close()被浏览器阻止，可以尝试其他方法
        setTimeout(() => {
            alert('游戏结束！最终得分：' + score);
        }, 100);
    }, 3000);
}

// 游戏循环
function gameLoop() {
    if (!gameRunning && gameStarted) return;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

// 初始化
function init() {
    // 创建城市背景
    createCityBackground();
    
    // 创建数字雨
    createDigitalRain();
    
    // 显示开始界面
    draw();
}

// 创建城市背景
function createCityBackground() {
    const cityBackground = document.getElementById('cityBackground');
    
    for (let i = 0; i < 15; i++) {
        const building = document.createElement('div');
        building.className = 'building';
        building.style.left = (i * 7) + '%';
        building.style.height = (Math.random() * 40 + 20) + '%';
        building.style.animationDelay = (Math.random() * 2) + 's';
        cityBackground.appendChild(building);
    }
}

// 创建数字雨
function createDigitalRain() {
    const digitalRain = document.getElementById('digitalRain');
    
    for (let i = 0; i < 50; i++) {
        const column = document.createElement('div');
        column.className = 'rain-column';
        column.style.left = Math.random() * 100 + '%';
        column.style.animationDelay = Math.random() * 3 + 's';
        column.style.animationDuration = (Math.random() * 2 + 2) + 's';
        digitalRain.appendChild(column);
    }
}

// 启动游戏
init();