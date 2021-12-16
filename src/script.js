// Constants
const JUMP = "jump";
const CROUCH = "crouch";
const ACTIVE = "active";
const HIGH_SCORE = "high-score";
const SCORE = "score";
const GAME_OVER = "game-over";
const GROUND_PET = "ground-pet";
const FLYING_PET = "flying-pet";
const FLYING_PET_BOTTOM_BOUNDARY = 50;
const GROUND_PET_RIGHT_BOUNDARY = 50;
const GROUND_PET_UPPER_BOUNDARY = 145;
const PET_LEFT_BOUNDARY = 20;
const PLAYER_COLLISION_WIDTH = 50;
const SCORE_CAP = 99999;

// Game board
const gameWindow = document.getElementById("game");
const player = document.getElementById("player");
const getGroundPets = () => document.querySelectorAll(`.${GROUND_PET}`);
const getFlyingPets = () => document.querySelectorAll(`.${FLYING_PET}`);

const main = document.querySelector("main");

// Increase difficulty at milestones
const DIFFICULTY_LEVELS = {
  0: {
    ground: 1,
    flying: 0,
  },
  75: {
    ground: 1,
    flying: 1,
  },
  150: {
    ground: 2,
    flying: 1,
  },
  300: {
    ground: 2,
    flying: 2,
  },
  600: {
    ground: 2,
    flying: 3,
  },
  1000: {
    ground: 3,
    flying: 3,
  },
  1200: {
    ground: 4,
    flying: 3,
  },
};
// Declaring at the top because it doesn't need re-declaring inside the game loop every loop
const DIFFICULT_LEVEL_KEYS = Object.keys(DIFFICULTY_LEVELS);

// Buttons
const playButton = document.getElementById("play-game");
const jumpButton = document.getElementById(JUMP);
const crouchButton = document.getElementById(CROUCH);

// Pet utilities
function generateNewGroundPet() {
  const newPet = document.createElement("img");
  newPet.src = "assets/ground-pet.svg";
  newPet.alt = "Ground enemy pet";
  newPet.classList.add(GROUND_PET);
  gameWindow.appendChild(newPet);
}
function generateNewFlyingPet() {
  const newPet = document.createElement("img");
  newPet.src = "assets/flying-pet.gif";
  newPet.alt = "Flying enemy pet";
  newPet.classList.add(FLYING_PET);
  gameWindow.appendChild(newPet);
}
function removeAllEnemyPets() {
  getGroundPets().forEach((pet) => pet.remove());
  getFlyingPets().forEach((pet) => pet.remove());
}

// Scores
function updateElement(element, score) {
  element.innerHTML = `${score}`.padStart(5, "0");
}
const currentScoreElement = document.getElementById(SCORE);
let currentScore = 0;
const highScoreElement = document.getElementById(HIGH_SCORE);
let highScore = localStorage.getItem(HIGH_SCORE) || 0;
updateElement(highScoreElement, highScore);

// Actions
function doAction(className, time) {
  if (gameWindow.classList.contains(ACTIVE)) {
    if (!player.classList.contains(className)) {
      player.classList.add(className);

      setTimeout(function () {
        player.classList.remove(className);
      }, time || 600);
    }
  }
}
function jump() {
  doAction(JUMP);
}
function crouch() {
  doAction(CROUCH, 1500);
}
jumpButton.onclick = function () {
  jump();
};
crouchButton.onclick = function () {
  crouch();
};
document.onkeydown = function (event) {
  if (event.key === " ") {
    jump();
  }
  if (event.key === "Shift") {
    crouch();
  }
  if (event.key === "Enter") {
    playButton.click();
  }
};

// Make speed of enemy pets somewhat random
function generateAnimationDuration(element, startingSpeed) {
  let newDuration = `${Math.floor(Math.random() * 2) + (startingSpeed || 3)}s`;
  element.style.animationDuration = newDuration;
}

// Initialise game variable as empty to avoid it running immediately
// It's a lazy workaround but... 🙃
let playGame;

// End game
function endGame() {
  getGroundPets().forEach((pet) => (pet.style.left = window.getComputedStyle(pet).getPropertyValue("left")));
  getFlyingPets().forEach((pet) => (pet.style.left = window.getComputedStyle(pet).getPropertyValue("left")));
  clearInterval(playGame);
  gameWindow.classList.remove(ACTIVE);
  main.classList.add(GAME_OVER);
  if (localStorage.getItem(HIGH_SCORE) < currentScore) {
    highScore = currentScore;
    localStorage.setItem(HIGH_SCORE, highScore);
    updateElement(highScoreElement, highScore);
  }
  playButton.disabled = false;
  jumpButton.disabled = true;
  crouchButton.disabled = true;
}

playButton.onclick = function () {
  // Reset stuff
  removeAllEnemyPets();
  if (playGame) clearInterval(playGame);
  main.classList.remove(GAME_OVER);
  gameWindow.classList.remove(ACTIVE);
  gameWindow.classList.add(ACTIVE);
  gameWindow.focus();
  playButton.disabled = true;
  jumpButton.disabled = false;
  crouchButton.disabled = false;
  currentScore = 0;

  // Start game
  playGame = setInterval(function () {
    const groundPets = Array.from(getGroundPets());
    const flyingPets = Array.from(getFlyingPets());

    for (const pet of groundPets) {
      if (!pet.style.animationDuration) {
        generateAnimationDuration(pet);
      }
    }
    for (const pet of flyingPets) {
      if (!pet.style.animationDuration) {
        generateAnimationDuration(pet, 7);
      }
    }

    // Update score
    currentScore++;
    updateElement(currentScoreElement, currentScore);

    if (currentScore > SCORE_CAP) {
      // Score can't go any higher
      endGame();
    }

    // Get player & enemy coords
    const playerStyles = window.getComputedStyle(player);
    const playerDimensions = {
      top: parseInt(playerStyles.getPropertyValue("top")),
      left: parseInt(playerStyles.getPropertyValue("left")),
    };
    const groundPetsLeft = Array.from(groundPets).map((groundPet) =>
      parseInt(window.getComputedStyle(groundPet).getPropertyValue("left"))
    );
    const flyingPetsDimensions = Array.from(flyingPets).map((flyingPet) => {
      const petStyles = window.getComputedStyle(flyingPet);
      return {
        top: parseInt(petStyles.getPropertyValue("top")),
        left: parseInt(petStyles.getPropertyValue("left")),
      };
    });

    // Ground pet collision
    for (const groundPetLeft of groundPetsLeft) {
      // Remember, there's a slight leeway in enemy hitbox to account for delay or bad player
      if (
        // Pet is within the boundary
        groundPetLeft < GROUND_PET_RIGHT_BOUNDARY &&
        // Pet is within the boundary
        groundPetLeft > PET_LEFT_BOUNDARY &&
        // Player hasn't jumped high enough - measured from top of window
        // (ie jumping takes player closer to top of window)
        playerDimensions.top >= GROUND_PET_UPPER_BOUNDARY
      ) {
        endGame();
      }
    }
    // Flying pet collision
    for (const flyingPetDimensions of flyingPetsDimensions) {
      if (
        // Player is right of the leftmost part of flying pet
        playerDimensions.left + PLAYER_COLLISION_WIDTH > flyingPetDimensions.left &&
        // Flying pet is not past the player
        flyingPetDimensions.left > PET_LEFT_BOUNDARY &&
        // Player is higher than the bottom part of the flying pet
        flyingPetDimensions.top + FLYING_PET_BOTTOM_BOUNDARY >= playerDimensions.top
      ) {
        endGame();
      }
    }

    // Add new enemy if needed
    let scoreCap = 0;
    DIFFICULT_LEVEL_KEYS.some((k) => {
      if (k > currentScore) return true;
      scoreCap = k;
    });
    if (groundPets.length < DIFFICULTY_LEVELS[scoreCap]?.ground) {
      generateNewGroundPet();
    }
    if (flyingPets.length < DIFFICULTY_LEVELS[scoreCap]?.flying) {
      generateNewFlyingPet();
    }
  }, 50);
};
