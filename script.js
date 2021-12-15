// Constants
const JUMP = "jump";
const CROUCH = "crouch";
const ACTIVE = "active";
const HIGH_SCORE = "high-score";
const GAME_OVER = "game-over";
const FLYING_PET_HEIGHT = 50;
const FLYING_PET_WIDTH = 50;
const DINO_COLLISION_WIDTH = 50;

// Game board
const gameWindow = document.getElementById("game");
const dino = document.getElementById("dino");
const groundPets = document.querySelectorAll(".ground-pet");
const flyingPet = document.querySelector(".flying-pet");

const main = document.querySelector("main");

// Buttons
const playButton = document.getElementById("play-game");
const crouchButton = document.getElementById(CROUCH);
const jumpButton = document.getElementById(JUMP);

// Scores
function updateElement(element, score) {
  element.innerHTML = `${score}`.padStart(5, "0");
}
const currentScoreElement = document.getElementById("score");
let currentScore = 0;
const highScoreElement = document.getElementById("high-score");
let highScore = localStorage.getItem(HIGH_SCORE) || 0;
updateElement(highScoreElement, highScore);

// Actions
function doAction(className, time) {
  if (gameWindow.classList.contains(ACTIVE)) {
    if (!dino.classList.contains(className)) {
      dino.classList.add(className);

      setTimeout(function () {
        dino.classList.remove(className);
      }, time || 700);
    }
  }
}
function jump() {
  doAction(JUMP);
}
function crouch() {
  doAction(CROUCH, 1500);
}
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

function generateAnimationDuration(elements, element) {
  const durations = Array.from(elements).map((e) => e.style.animationDuration);
  let newDuration = `${Math.floor(Math.random() * 5) + 3}s`;

  if (durations.length < 5 && durations.includes(newDuration)) {
    // Avoid duplicate speeds
    generateAnimationDuration(elements, element);
  } else {
    element.style.animationDuration = newDuration;
  }
}

let playGame;

function endGame() {
  // End game
  // alert("Game Over!");
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
  for (const groundPet of groundPets) {
    generateAnimationDuration(groundPets, groundPet);
  }
  if (playGame) clearInterval(playGame);
  gameWindow.focus();
  groundPets.forEach((groundPet) => (groundPet.style.left = "600px"));
  main.classList.remove(GAME_OVER);
  gameWindow.classList.remove(ACTIVE);
  gameWindow.classList.add(ACTIVE);
  currentScore = 0;
  playButton.disabled = true;
  jumpButton.disabled = false;
  crouchButton.disabled = false;

  // Start game
  playGame = setInterval(function () {
    currentScore++;
    updateElement(currentScoreElement, currentScore);

    const dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue("top"));
    const dinoLeft = parseInt(window.getComputedStyle(dino).getPropertyValue("left"));
    const groundPetsLeft = Array.from(groundPets).map((groundPet) =>
      parseInt(window.getComputedStyle(groundPet).getPropertyValue("left"))
    );
    const flyingPetTop = parseInt(window.getComputedStyle(flyingPet).getPropertyValue("top"));
    const flyingPetLeft = parseInt(window.getComputedStyle(flyingPet).getPropertyValue("left"));

    // Ground pet collision
    for (const groundPetLeft of groundPetsLeft) {
      if (groundPetLeft < 65 && groundPetLeft > 15 && dinoTop >= 145) {
        endGame();
      }
    }
    // Flying pet collision
    if (
      dinoLeft + DINO_COLLISION_WIDTH > flyingPetLeft &&
      flyingPetLeft > 20 &&
      flyingPetTop + FLYING_PET_HEIGHT >= dinoTop
    ) {
      endGame();
    }
  }, 50);
};

crouchButton.onclick = function () {
  crouch();
};

jumpButton.onclick = function () {
  jump();
};