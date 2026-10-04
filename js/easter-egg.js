/**
 * Easter Egg - Ridder Hoppe-Spill
 * Aktiveres med konami-kode: ↑ ↑ ↓ ↓ ← → ← → B A
 * Eller skriv "ridder" på tastaturet
 * 
 * @package ArmeRiddere
 * @author Mannskoret Arme Riddere
 */

(function () {
  'use strict';

  // Konami-kode sekvens
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiPosition = 0;

  // "ridder" aktivering
  const secretWord = 'ridder';
  let typedKeys = '';
  let resetTimer;

  // Spill-tilstand
  let gameActive = false;
  let canvas, ctx;
  let gameContainer;
  let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Spill-objekter
  const game = {
    knight: {
      x: 50,
      y: 0,
      width: 40,
      height: 50,
      velocityY: 0,
      jumping: false,
      rotation: 0,
      // Animation states
      state: 'running', // 'running', 'jumping', 'falling'
      frameX: 0,
      frameTimer: 0,
      frameInterval: 100, // milliseconds between frames
      // Animation cycles
      runCycle: 0,
      jumpCycle: 0,
      // Physics
      weight: 0.6,
      maxJumpHeight: -13
    },
    obstacles: [],
    score: 0,
    speed: 5,
    gravity: 0.6,
    jumpPower: -12,
    groundY: 0,
    lastTime: 0
  };

  let animationId;

  // ========================================
  // Aktiver easter egg
  // ========================================
  function initEasterEgg() {
    // Konami-kode lytter (kun desktop)
    if (!isMobile) {
      document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiPosition]) {
          konamiPosition++;
          if (konamiPosition === konamiCode.length) {
            activateGame();
            konamiPosition = 0;
          }
        } else {
          konamiPosition = 0;
        }
      });

      // "ridder" lytter (kun desktop)
      document.addEventListener('keypress', (e) => {
        clearTimeout(resetTimer);
        typedKeys += e.key.toLowerCase();

        if (typedKeys.includes(secretWord)) {
          activateGame();
          typedKeys = '';
        }

        // Reset etter 2 sekunder inaktivitet
        resetTimer = setTimeout(() => {
          typedKeys = '';
        }, 2000);
      });
    }

    // Lang-trykk på logo (mobil og desktop)
    setupLogoLongPress();
  }

  // ========================================
  // Lang-trykk
  // ========================================
  function setupLogoLongPress() {
    // Venter litt for at siden skal laste
    setTimeout(() => {
      const ridderWord = document.querySelector('#easter-egg-trigger');

      if (!ridderWord) {
        console.log('⚠️ Easter egg: Kunne ikke finne "ridder"-ordet');
        return;
      }

      let pressTimer;

      // Visuell feedback - endre cursor
      ridderWord.style.cursor = 'pointer';
      ridderWord.style.userSelect = 'none'; // Forhindre tekstmarkering

      // Touch events (mobil)
      ridderWord.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Forhindre tekstmarkering på mobil
        pressTimer = setTimeout(() => {
          activateGame();
          // Vibrering hvis støttet
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }, 2000); // 1 sekund lang-trykk
      });

      ridderWord.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
      });

      ridderWord.addEventListener('touchmove', () => {
        clearTimeout(pressTimer);
      });

      // Mouse events (desktop)
      ridderWord.addEventListener('mousedown', (e) => {
        if (!isMobile) {
          e.preventDefault(); // Forhindre tekstmarkering
          pressTimer = setTimeout(() => {
            activateGame();
          }, 2000);
        }
      });

      ridderWord.addEventListener('mouseup', () => {
        if (!isMobile) {
          clearTimeout(pressTimer);
        }
      });

      ridderWord.addEventListener('mouseleave', () => {
        if (!isMobile) {
          clearTimeout(pressTimer);
        }
      });

      console.log('🏰 Easter egg aktivert! Hold på ordet "ridder" i 1 sekund...');
    }, 500); // Vent 500ms for at DOM skal laste
  }

  // ========================================
  // Aktiver spillet
  // ========================================
  function activateGame() {
    if (gameActive) return;

    console.log('🏰 Easter egg aktivert! Ridder-spill starter...');
    gameActive = true;

    createGameContainer();
    startGame();
  }

  // ========================================
  // Opprett spill-container
  // ========================================
  function createGameContainer() {
    // Container
    gameContainer = document.createElement('div');
    gameContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #87CEEB 0%, #98D8E8 100%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Poppins', sans-serif;
    `;

    // Tittel
    const title = document.createElement('h1');
    title.textContent = '🏰 Ridderløp 🏰';
    title.style.cssText = `
      color: #333;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    `;

    // Canvas - responsivt for mobil
    canvas = document.createElement('canvas');
    if (isMobile) {
      canvas.width = Math.min(window.innerWidth - 40, 600);
      canvas.height = 300;
    } else {
      canvas.width = 800;
      canvas.height = 400;
    }
    canvas.style.cssText = `
      border: 4px solid #333;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      max-width: 100%;
    `;
    ctx = canvas.getContext('2d');

    // Instruksjoner - forskjellig tekst for mobil/desktop
    const instructions = document.createElement('p');
    instructions.textContent = isMobile
      ? 'Trykk på skjermen for å hoppe! 📱'
      : 'Trykk SPACE eller PILTAST OPP for å hoppe. ESC for å avslutte.';
    instructions.style.cssText = `
      color: #333;
      margin-top: 20px;
      font-size: ${isMobile ? '16px' : '18px'};
      padding: 0 20px;
      text-align: center;
    `;

    // Poeng
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.style.cssText = `
      position: absolute;
      top: ${isMobile ? '20px' : '40px'};
      right: ${isMobile ? '70px' : '40px'};
      font-size: ${isMobile ? '24px' : '32px'};
      font-weight: bold;
      color: #333;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    `;
    scoreDisplay.textContent = 'Poeng: 0';

    // Lukkeknapp (spesielt for mobil)
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      font-size: 24px;
      cursor: pointer;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    closeButton.addEventListener('click', endGame);
    closeButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      endGame();
    });

    gameContainer.appendChild(title);
    gameContainer.appendChild(scoreDisplay);
    gameContainer.appendChild(closeButton);
    gameContainer.appendChild(canvas);
    gameContainer.appendChild(instructions);
    document.body.appendChild(gameContainer);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';
  }

  // ========================================
  // Start spillet
  // ========================================
  function startGame() {
    game.groundY = canvas.height - 50;
    game.knight.y = game.groundY - game.knight.height;
    game.obstacles = [];
    game.score = 0;
    game.speed = 5;
    game.lastTime = 0; // Initialize timestamp for deltaTime

    // Reset knight animation state
    game.knight.state = 'running';
    game.knight.frameTimer = 0;
    game.knight.runCycle = 0;
    game.knight.jumpCycle = 0;

    // Kontroller
    document.addEventListener('keydown', handleJump);
    document.addEventListener('keydown', handleExit);

    // Touch-kontroller for mobil
    if (isMobile) {
      canvas.addEventListener('touchstart', handleTouchJump);
    }

    // Start game loop
    gameLoop();
  }

  // ========================================
  // Touch-hopp (mobil)
  // ========================================
  function handleTouchJump(e) {
    e.preventDefault();
    if (!game.knight.jumping) {
      game.knight.velocityY = game.jumpPower;
      game.knight.jumping = true;
      // Vibrering ved hopp
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }

  // ========================================
  // Hopp
  // ========================================
  function handleJump(e) {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !game.knight.jumping) {
      e.preventDefault();
      game.knight.velocityY = game.jumpPower;
      game.knight.jumping = true;
    }
  }

  // ========================================
  // Avslutt
  // ========================================
  function handleExit(e) {
    if (e.code === 'Escape') {
      endGame();
    }
  }

  // ========================================
  // Spill-loop
  // ========================================
  function gameLoop(timeStamp) {
    if (!gameActive) return;

    // Calculate deltaTime
    const deltaTime = timeStamp - game.lastTime;
    game.lastTime = timeStamp;

    // Clear canvas
    ctx.fillStyle = '#E8F4F8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tegn bakke
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, game.groundY, canvas.width, 50);

    // Tegn gress
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, game.groundY, canvas.width, 10);

    // Oppdater ridder
    updateKnight(deltaTime);
    drawKnight();

    // Oppdater hindringer
    updateObstacles();
    drawObstacles();

    // Sjekk kollisjon
    checkCollision();

    // Oppdater poeng
    updateScore();

    animationId = requestAnimationFrame(gameLoop);
  }

  // ========================================
  // Oppdater ridder
  // ========================================
  function updateKnight(deltaTime) {
    const knight = game.knight;

    // Gravitasjon (physics inspired by KnightsRun)
    knight.velocityY += knight.weight;
    knight.y += knight.velocityY;

    // Sjekk om på bakken
    const onGround = knight.y >= game.groundY - knight.height;

    if (onGround) {
      knight.y = game.groundY - knight.height;
      knight.velocityY = 0;
      knight.jumping = false;
      knight.rotation = 0;
      knight.state = 'running';
      knight.jumpCycle = 0; // Reset jump animation on landing
    } else {
      // I luften - sjekk om vi faller eller hopper
      knight.state = knight.velocityY < 0 ? 'jumping' : 'falling';
    }

    // Animation states (inspired by KnightsRun's frame system)
    knight.frameTimer += deltaTime;

    if (knight.frameTimer > knight.frameInterval) {
      knight.frameTimer = 0;

      // Running animation cycle
      if (knight.state === 'running') {
        knight.runCycle = (knight.runCycle + 1) % 4;
      }
      // Jump animation cycle
      else if (knight.state === 'jumping') {
        knight.jumpCycle = Math.min(knight.jumpCycle + 1, 3);
      }
      // Falling animation
      else if (knight.state === 'falling') {
        knight.jumpCycle = 4;
      }
    }

    // Rotasjon under hopp (smooth rotation)
    if (knight.jumping || knight.state === 'jumping') {
      knight.rotation = Math.min(knight.rotation + 0.08, Math.PI / 6);
    } else if (knight.state === 'falling') {
      knight.rotation = Math.min(knight.rotation + 0.05, Math.PI / 4);
    }
  }

  // ========================================
  // Tegn ridder (8-bit tuxedo man)
  // ========================================
  function drawKnight() {
    const knight = game.knight;

    ctx.save();
    ctx.translate(knight.x + knight.width / 2, knight.y + knight.height / 2);
    ctx.rotate(knight.rotation);

    // Animation offsets based on state
    let bodyBounce = 0;
    let legOffset = 0;
    let armSwing = 0;

    if (knight.state === 'running') {
      // Running animation - 8-bit style
      bodyBounce = Math.sin(knight.runCycle * Math.PI / 2) * 1.5;
      legOffset = Math.sin(knight.runCycle * Math.PI / 2) * 4;
      armSwing = Math.cos(knight.runCycle * Math.PI / 2) * 3;
    } else if (knight.state === 'jumping') {
      bodyBounce = -2;
      legOffset = -4;
    } else if (knight.state === 'falling') {
      bodyBounce = 1;
      legOffset = 3;
    }

    // === 8-BIT PIXELATED HUMAN ===

    // Legs (black pants)
    ctx.fillStyle = '#000';
    // Left leg
    ctx.fillRect(-6, 8 + legOffset + bodyBounce, 4, 10);
    // Right leg  
    ctx.fillRect(2, 8 - legOffset + bodyBounce, 4, 10);

    // Shoes (black)
    ctx.fillStyle = '#111';
    ctx.fillRect(-7, 17 + legOffset + bodyBounce, 5, 3);
    ctx.fillRect(2, 17 - legOffset + bodyBounce, 5, 3);

    // Torso (black tuxedo)
    ctx.fillStyle = '#000';
    ctx.fillRect(-8, -6 + bodyBounce, 16, 14);

    // White shirt front (pixelated)
    ctx.fillStyle = '#fff';
    ctx.fillRect(-3, -4 + bodyBounce, 6, 10);

    // Orange band across chest (Arme Riddere color)
    ctx.fillStyle = '#ec6c00';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-3 + i * 2, bodyBounce + i - 2, 2, 3);
    }

    // Bow tie (black)
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, -5 + bodyBounce, 3, 2);
    ctx.fillRect(1, -5 + bodyBounce, 3, 2);
    ctx.fillRect(-1, -6 + bodyBounce, 2, 3);

    // Arms (black tuxedo sleeves)
    ctx.fillStyle = '#000';
    // Left arm
    ctx.fillRect(-10 + armSwing, -4 + bodyBounce, 3, 10);
    // Right arm
    ctx.fillRect(7 - armSwing, -4 + bodyBounce, 3, 10);

    // Hands (skin tone - pixelated)
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(-10 + armSwing, 5 + bodyBounce, 3, 3);
    ctx.fillRect(7 - armSwing, 5 + bodyBounce, 3, 3);

    // Neck (skin tone)
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(-3, -8 + bodyBounce, 6, 3);

    // Head (skin tone - 8-bit square)
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(-5, -16 + bodyBounce, 10, 9);

    // Hair (black - 8-bit style)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-5, -17 + bodyBounce, 10, 3);
    ctx.fillRect(-6, -16 + bodyBounce, 1, 3);
    ctx.fillRect(5, -16 + bodyBounce, 1, 3);

    // Eyes (simple pixels)
    ctx.fillStyle = '#000';
    ctx.fillRect(-3, -13 + bodyBounce, 2, 1);
    ctx.fillRect(1, -13 + bodyBounce, 2, 1);
    ctx.fillStyle = '#00f';
    ctx.fillRect(-2, -12 + bodyBounce, 1, 1);
    ctx.fillRect(2, -12 + bodyBounce, 1, 1);

    // Smile (optional - 8-bit)
    ctx.fillStyle = '#000';
    ctx.fillRect(-2, -9 + bodyBounce, 1, 1);
    ctx.fillRect(-1, -8 + bodyBounce, 1, 1);
    ctx.fillRect(0, -8 + bodyBounce, 1, 1);
    ctx.fillRect(1, -9 + bodyBounce, 1, 1);

    ctx.restore();

    // Debug indicator
    if (false) {
      ctx.fillStyle = '#333';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(knight.state, knight.x + knight.width / 2, knight.y - 10);
    }
  }

  // ========================================
  // Oppdater hindringer
  // ========================================
  function updateObstacles() {
    // Spawn nye hindringer
    if (game.obstacles.length === 0 || game.obstacles[game.obstacles.length - 1].x < canvas.width - 300) {
      const type = Math.random() > 0.5 ? 'barrel' : 'spear';
      game.obstacles.push({
        x: canvas.width,
        y: game.groundY - (type === 'barrel' ? 30 : 30),
        width: type === 'barrel' ? 30 : 15,
        height: type === 'barrel' ? 30 : 40,
        type: type
      });
    }

    // Flytt hindringer
    game.obstacles.forEach((obstacle, index) => {
      obstacle.x -= game.speed;

      // Fjern hindringer utenfor skjermen
      if (obstacle.x + obstacle.width < 0) {
        game.obstacles.splice(index, 1);
        game.score += 10;
      }
    });

    // Øk hastighet gradvis
    game.speed = 5 + (game.score / 100);
  }

  // ========================================
  // Tegn hindringer
  // ========================================
  function drawObstacles() {
    game.obstacles.forEach(obstacle => {
      if (obstacle.type === 'barrel') {
        // Tønne
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillStyle = '#654321';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, 5, obstacle.height - 10);
        ctx.fillRect(obstacle.x + 20, obstacle.y + 5, 5, obstacle.height - 10);
      } else {
        // Spyd
        ctx.fillStyle = '#666';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height - 10);

        // Spiss
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y - 10);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
        ctx.fill();
      }
    });
  }

  // ========================================
  // Sjekk kollisjon
  // ========================================
  function checkCollision() {
    game.obstacles.forEach(obstacle => {
      if (
        game.knight.x < obstacle.x + obstacle.width &&
        game.knight.x + game.knight.width > obstacle.x &&
        game.knight.y < obstacle.y + obstacle.height &&
        game.knight.y + game.knight.height > obstacle.y
      ) {
        gameOver();
      }
    });
  }

  // ========================================
  // Oppdater poeng
  // ========================================
  function updateScore() {
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
      scoreDisplay.textContent = `Poeng: ${game.score}`;
    }
  }

  // ========================================
  // Game Over
  // ========================================
  function gameOver() {
    gameActive = false;
    cancelAnimationFrame(animationId);

    // Game over skjerm
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);

    ctx.font = '32px Poppins';
    ctx.fillText(`Din score: ${game.score}`, canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '20px Poppins';
    const exitText = isMobile ? 'Trykk ✕ for å avslutte' : 'Trykk ESC for å avslutte';
    ctx.fillText(exitText, canvas.width / 2, canvas.height / 2 + 60);

    // Fjern spillkontroller
    document.removeEventListener('keydown', handleJump);
    if (isMobile && canvas) {
      canvas.removeEventListener('touchstart', handleTouchJump);
    }
  }

  // ========================================
  // Avslutt spillet
  // ========================================
  function endGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);

    if (gameContainer) {
      gameContainer.remove();
    }

    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleJump);
    document.removeEventListener('keydown', handleExit);

    if (isMobile && canvas) {
      canvas.removeEventListener('touchstart', handleTouchJump);
    }

    console.log('👋 Ridder-spill avsluttet!');
  }

  // ========================================
  // Initialiser når siden laster
  // ========================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEasterEgg);
  } else {
    initEasterEgg();
  }

})();
