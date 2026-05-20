let firstCard = null;
let secondCard = null;
let boardLocked = false;
let gameActive = false;

let totalPairs = 0;
let pairsMatched = 0;
let clicks = 0;
let timeLeft = 0;
let gameTimerInterval = null;


const config =
{
  easy: { pairs: 3, time: 30 },
  medium: { pairs: 6, time: 60 },
  hard: { pairs: 12, time: 120 }
};


// ===============================
// START / INITIALIZE GAME
// ===============================

async function initGame() 
{
  // stop timers
  clearInterval(gameTimerInterval);

  //reset vars
  resetMetrics();

  //dificulty init
  const difficulty = $("#difficulty").val();
  totalPairs = config[difficulty].pairs;
  timeLeft = config[difficulty].time;

  //hide start game msg
  $("#game_message").addClass("hidden").text("");

  updateStatusDisplay();

  //power up reset
  $("#powerup_btn").prop("disabled", false);

  //fetch list of pokemon
  const pokemonList = await fetchRandomPokemon(totalPairs);

  //render board with that list
  renderBoard(pokemonList);

  //game on
  gameActive = true;
  startTimer();
}


function resetMetrics() 
{
  firstCard = null;
  secondCard = null;

  boardLocked = false;
  clicks = 0;
  pairsMatched = 0;
}


function updateStatusDisplay() 
{
  $("#clicks_count").text(clicks);
  $("#pairs_matched").text(pairsMatched);
  $("#pairs_left").text(totalPairs - pairsMatched);
  $("#total_pairs").text(totalPairs);
  $("#timer_count").text(`${timeLeft}s`);
}

async function fetchRandomPokemon(pairCount) 
{
  const pokemonSet = [];

  //looping till we got enough pokemons
  while (pokemonSet.length < pairCount) 
    {
    // Random pokemon ID between 1 - 800
    const randomId = Math.floor(Math.random() * 1000) + 1;

    // some return true if () condition is true
    if (!pokemonSet.some(p => p.id === randomId)) 
    {
      try 
      {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();

        //store pokemon int he array
        pokemonSet.push(
          {
            id: randomId,
            name: data.name,
            img: data.sprites.other["official-artwork"].front_default
          });
      }
      catch (err) {
        //to catch fetch fail
        console.error("skip", err);
      }
    }
  }

  //duplicate array to get pairs
  const gameDeck = [...pokemonSet, ...pokemonSet];

  //sort that final array and return it
  return gameDeck.sort(() => Math.random() - 0.5);
}


function renderBoard(deck) 
{
  const grid = $("#game_grid");
  grid.empty();

  // Loop through each pokemon
  deck.forEach((pokemon, index) => 
    {
    // HTML for each card
    const cardHtml = `
      <div class="card" data-pokename="${pokemon.name}" id="card_${index}">
        <img class="front_face" src="${pokemon.img}" alt="${pokemon.name}">
        <img class="back_face" src="back.webp" alt="Pokeball Backing">
      </div>
    `;

    grid.append(cardHtml);
  });

  //add click event to every card
  $(".card").on("click", handleCardFlip);
}


function handleCardFlip() 
{
  if (!gameActive || boardLocked) 
  {
    return;
  }

  // prevent click same cared
  if ($(this).hasClass("flip")) 
  {
    return;
  }

  // visual flip
  $(this).addClass("flip");

  clicks++;

  // if first card = null
  if (!firstCard) 
  {
    firstCard = $(this);
    updateStatusDisplay();
    return;
  }

  //second card logic
  secondCard = $(this);
  updateStatusDisplay();
  checkMatchCondition();
}


function checkMatchCondition() {
  boardLocked = true;

  const matchFound = firstCard.data("pokename") === secondCard.data("pokename");

  if (matchFound) 
  {
    pairsMatched++;
    updateStatusDisplay();

    //disable click again on good pair
    clearSelection(true);
    checkWinCondition();
  }
  else {
    // 1 sec penatly for fail
    setTimeout(() => {
      firstCard.removeClass("flip");
      secondCard.removeClass("flip");

      // reset selected cards
      clearSelection(false);

    }, 1000);
  }
}


function clearSelection(isMatch) {
  if (isMatch) {
    // make matched cards not clickable
    firstCard.off("click");
    secondCard.off("click");
  }

  // reset temp vars
  firstCard = null;
  secondCard = null;

  boardLocked = false;
}


function startTimer() {
  // 1000 so thats every second 
  gameTimerInterval = setInterval(() => {
    timeLeft--;
    updateStatusDisplay();

    //time up
    if (timeLeft <= 0) {
      endGame(false);
    }

  }, 1000);
}


function checkWinCondition() {
  if (pairsMatched === totalPairs) {
    // make victory true
    endGame(true);
  }
}


function endGame(victory) {
  gameActive = false;

  // stop timr
  clearInterval(gameTimerInterval);

  // jQuery to get msg element
  const msgElement = $("#game_message").removeClass("hidden");

  // win
  if (victory) {
    msgElement
      .text("Congratulations! You found all matches!")
      .css("color", "green");
  }
  else {
    // loss
    msgElement
      .text("Time up! Game Over.")
      .css("color", "red");

    // flip all
    $(".card").addClass("flip");
  }
}


function setup() {
  $("#start_btn").on("click", initGame);

  $("#reset_btn").on("click", initGame);

  $("#theme_toggle").on("click", function () {
    // Select html root element
    const root = $("html");

    // Get current theme
    const currentTheme = root.attr("data-theme");

    // if dark do light else dark
    root.attr(
      "data-theme",
      currentTheme === "dark" ? "light" : "dark"
    );
  });

  // POWER UP BUTTON STUFF
  $("#powerup_btn").on("click", function () {
    // stop use if game inactive or locked
    if (!gameActive || boardLocked) {
      return;
    }

    // lock game for powerup
    boardLocked = true;

    // select unflipped cards
    const unFlippedCards = $(".card").not(".flip");

    // show all hidden cards temporarily
    unFlippedCards.addClass("flip");

    // Wait 1.5 seconds
    setTimeout(() => {
      unFlippedCards.each(function () {
        // prevent matched cards from flipping back
        if ($(this).css("pointer-events") !== "none") {//this = current unfliped card
          $(this).removeClass("flip");
        }
      });

      // Unlock board
      boardLocked = false;

      // take power up after 1 use
      $("#powerup_btn").prop("disabled", true);

    }, 1500);
  });

  // Press start to play msg
  $("#game_message")
    .removeClass("hidden")
    .text("Press Start to Play!");
}


// run setup when html loaded
$(document).ready(setup);