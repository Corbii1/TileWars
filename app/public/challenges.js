//DG964, FILE FOR CHALLENGES

function startChallenge(type) {
  const modal = document.getElementById("challengeModal");
  const container = document.getElementById("challengeContainer");
  //CLEAR PREVIOUS CHALLENGE CONTENT
  container.innerHTML = "";

  //TYPING CHALLENGE, GIVES A RANDOM GENERATED STRING OF 15 CHARACTERS TO TYPE WITHIN 7 SECONDS
  if (type === "typing") {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let randomString = "";
    for (let i = 0; i < 15; i++) {
      randomString += letters[Math.floor(Math.random() * letters.length)];
    }

    //CHALLENGE BOARD
    container.innerHTML = `
      <h3>Type the following letters:</h3>
      <div style="margin-bottom: 10px; font-family: monospace; font-size: 20px;">${randomString}</div>
      <input type="text" id="typingInput" placeholder="Type here..." autocomplete="off" style="width: 100%; font-size: 18px; font-family: monospace;" />
      <div id="typingFeedback" style="margin-top: 10px; font-family: monospace; font-size: 20px;"></div>
      <div id="typingTimer" style="margin-top: 10px; font-weight: bold;"></div>
      <button id="startBtn" style="margin-top: 10px; padding: 8px 16px;">Start Challenge</button>
      <div id="typingResult" style="margin-top: 15px; font-size: 18px; font-weight: bold;"></div>
    `;
    const input = document.getElementById("typingInput");
    const feedback = document.getElementById("typingFeedback");
    const timerDisplay = document.getElementById("typingTimer");
    const startBtn = document.getElementById("startBtn");
    const resultDiv = document.getElementById("typingResult");

    //DISABLE INPUT UNTIL CHALLENGE STARTS, 7 SECONDS ON CLOCK
    input.disabled = true; 
    let challengeStarted = false;
    let challengeEnded = false;
    let timerInterval;
    let timeLeft = 7;

    //UPDATE FEEDBACK WITH COLORED LETTERS BASED ON TYPING ACCURACY, CORRECT IS GREEN, WRONG IS RED
    function updateFeedback() {
      const typed = input.value;
      let result = "";
      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === randomString[i]) {
          result += `<span style="color: green;">${typed[i]}</span>`;
        } 
        else {
          result += `<span style="color: red;">${typed[i]}</span>`;
        }
      }

      //EVERYTHING ELSE, GRAY
      let rest = randomString.slice(typed.length);
      result += `<span style="color: gray;">${rest}</span>`;
      feedback.innerHTML = result;
    }

    //UPDATE TIMER DISPLAY
    function updateTimer() {
      timerDisplay.textContent = `Time left: ${timeLeft}s`;
    }

    //END THE CHALLENGE, DISABLE INPUT, SHOW RESULTS
    function endChallenge() {
      challengeEnded = true;
      input.disabled = true;
      startBtn.style.display = "none";
      timerDisplay.textContent = "Time's up!";

      //GET NUM CORRECT LETTERS, RETURN INFO
      const typed = input.value;
      let correctCount = 0;
      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === randomString[i]) correctCount++;
      }
      resultDiv.textContent = `You typed ${correctCount} letters correctly!`;
    }

    //START BUTTON CLICK HANDLER
    startBtn.addEventListener("click", () => {
      if (challengeStarted) return;
      challengeStarted = true;
      input.disabled = false;
      input.focus();
      startBtn.style.display = "none";
      updateTimer();
      timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          endChallenge();
        } else {
          updateTimer();
        }
      }, 1000);
    });

    //UPDATE FEEDBACK AS USER TYPES
    input.addEventListener("input", () => {
      if (!challengeStarted || challengeEnded) {
        return;
      }
      updateFeedback();
    });
    updateFeedback();
  } 

  //COLOR TEST, SHOWS 4 BOXES WITH ONE BOX BEING A DIFFERENT COLOR THAN THE REST, CLICK DIFFERENT COLOR TO CONTINUE, 3 ROUNDS, 7S
  else if (type === "colorTest") {
    const totalRounds = 3;
    let currentRound = 0;
    let score = 0;
    const totalTime = 7;
    let timeLeft = totalTime;
    let timerInterval;
    const baseColors = [
      {r: 255, g: 0, b: 0},
      {r: 0, g: 255, b: 0},
      {r: 0, g: 0, b: 255},
      {r: 255, g: 255, b: 0},
      {r: 255, g: 165, b: 0}
    ];

    //CHALLENGE BOARD
    container.innerHTML = `
      <h3>Find the box with the different color:</h3>
      <div id="colorBoxes" style="display: flex; justify-content: center; gap: 15px; margin-top: 20px; border: 3px solid transparent; padding: 10px; border-radius: 8px;"></div>
      <div id="colorTestTimer" style="margin-top: 15px; font-weight: bold; text-align: center;"></div>
      <div id="colorTestResult" style="margin-top: 15px; font-size: 18px; font-weight: bold; text-align: center;"></div>
      <button id="startBtn" style="margin-top: 20px; padding: 8px 16px;">Start Challenge</button>
    `;
    const boxesContainer = document.getElementById("colorBoxes");
    const timerDisplay = document.getElementById("colorTestTimer");
    const resultDiv = document.getElementById("colorTestResult");
    const startBtn = document.getElementById("startBtn");

    //START BUTTON CLICK HANDLER
    startBtn.addEventListener("click", () => {
      startBtn.style.display = "none";
      startRound();
      timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time left: ${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          endChallenge();
        }
      }, 1000);
    });

    //HELPER TO CONVERT RGB OBJECT TO CSS STRING
    function rgbToCss(rgb) {
      return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    }

    //GET A COLOR SLIGHTLY DIFFERENT FROM THE BASE COLOR
    function getSlightlyDifferentColor(color) {
      const variation = 120;
      let newColor = { ...color };

      //PICK TWO DISTINCT RANDOM COLOR CHANNELS TO VARY
      const channels = ["r", "g", "b"];
      const firstIndex = Math.floor(Math.random() * 3);
      let secondIndex;
      do {
        secondIndex = Math.floor(Math.random() * 3);
      } 
      while (secondIndex === firstIndex);
      const firstChannel = channels[firstIndex];
      const secondChannel = channels[secondIndex];

      //ADD OR SUBTRACT VARIATION ON SELECTED CHANNELS, CLAMP BETWEEN 0-255
      [firstChannel, secondChannel].forEach(channel => {
        if (Math.random() < 0.5) {
          newColor[channel] = Math.max(0, color[channel] - variation);
        } 
        else {
          newColor[channel] = Math.min(255, color[channel] + variation);
        }
      });
      return newColor;
    }
    let allowClick = true;

    //START A ROUND
    function startRound() {
      boxesContainer.innerHTML = "";
      resultDiv.textContent = "";
      boxesContainer.style.borderColor = "transparent";
      allowClick = true;
      if (currentRound >= totalRounds) {
        endChallenge();
        return;
      }
      const baseColor = baseColors[currentRound % baseColors.length];
      const diffColor = getSlightlyDifferentColor(baseColor);
      const oddIndex = Math.floor(Math.random() * 4);
      for (let i = 0; i < 4; i++) {
        const box = document.createElement("div");
        box.style.width = "70px";
        box.style.height = "70px";
        box.style.border = "3px solid transparent";
        box.style.cursor = "pointer";
        box.style.borderRadius = "8px";
        if (i === oddIndex) {
          box.style.backgroundColor = rgbToCss(diffColor);
          box.dataset.isOdd = "true";
        } 
        else {
          box.style.backgroundColor = rgbToCss(baseColor);
          box.dataset.isOdd = "false";
        }

        //CLICK HANDLER FOR EACH COLOR BOX
        box.addEventListener("click", () => {
          if (!allowClick) return;
          if (box.dataset.isOdd === "true") {
            box.style.borderColor = "green";
            score++;
            currentRound++;
            allowClick = false;

            //SHORT DELAY BEFORE NEXT ROUND
            setTimeout(() => {
              startRound();
            }, 500);
          } 
          else {

            // WRONG CHOICE, HIGHLIGHT BORDER RED, ALLOW RETRY
            boxesContainer.style.borderColor = "red";
          }
        });
        boxesContainer.appendChild(box);
      }
    }

    //END COLOR TEST CHALLENGE AND SHOW SCORE
    function endChallenge() {
      clearInterval(timerInterval);
      boxesContainer.innerHTML = "";
      timerDisplay.textContent = "Time's up!";
      resultDiv.textContent = `You found ${score} out of ${totalRounds} correct!`;
      awardSquares(score);
    }
  }

  //MEMORY CHALLENGE, TWO ROWS OF COLORED BOXES, MATCH THEM IN 7 SECONDS
  else if (type === "memory") {
    const colors = ["red", "green", "blue", "yellow"];
    const totalMatches = colors.length;
    let matches = 0;
    let firstSelection = null;
    let secondSelection = null;
    let timeoutId = null;
    let timeLeft = 7;
    let timerInterval = null;

    //SHUFFLE FUNCTION TO RANDOMIZE COLORS
    function shuffle(array) {
        return array
        .map((a) => ({ sort: Math.random(), value: a }))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value);
    }

    //CHALLENGE BOARD
    container.innerHTML = `
        <h3>Click matching colors</h3>
        <button id="startBtn" style="margin-bottom: 15px; padding: 8px 16px;">Start Challenge</button>
        <div id="memoryTimer" style="font-weight: bold; margin-bottom: 10px;"></div>
        <div id="memoryGameArea" style="display: none;">
        <div style="display: flex; justify-content: center; gap: 40px;">
            <div id="leftColumn"></div>
            <div id="rightColumn"></div>
        </div>
        </div>
        <div id="memoryResult" style="margin-top: 15px; font-weight: bold;"></div>
    `;
    const leftCol = container.querySelector("#leftColumn");
    const rightCol = container.querySelector("#rightColumn");
    const timerDisplay = container.querySelector("#memoryTimer");
    const resultDiv = container.querySelector("#memoryResult");
    const startBtn = container.querySelector("#startBtn");
    const gameArea = container.querySelector("#memoryGameArea");

    //CREATE COLOR BOX ELEMENTS
    function createBox(color) {
        const box = document.createElement("div");
        box.style.width = "40px";
        box.style.height = "40px";
        box.style.margin = "5px";
        box.style.borderRadius = "6px";
        box.style.border = "2px solid black";
        box.style.backgroundColor = color;
        box.style.cursor = "pointer";
        box.classList.add("memory-box");
        box.dataset.color = color;
        return box;
    }

    //UPDATE TIMER DISPLAY
    function updateTimer() {
        timerDisplay.textContent = `Time left: ${timeLeft}s`;
    }

    //END MEMORY CHALLENGE, DISABLE CLICKING + BOXES, RETURN RESULT
    function endChallenge() {
        clearInterval(timerInterval);
        timerDisplay.textContent = "Time's up!";
        container.querySelectorAll(".memory-box").forEach((box) => {
        box.style.pointerEvents = "none";
        });
        resultDiv.textContent = `You matched ${matches} of ${totalMatches} colors!`;
    }

    //RESET BORDER COLORS AFTER WRONG SELECTION
    function resetSelections() {
        if (firstSelection && secondSelection) {
        firstSelection.style.borderColor = "black";
        secondSelection.style.borderColor = "black";
        firstSelection = null;
        secondSelection = null;
        }
    }

    //HANDLE BOX CLICK SELECTION LOGIC
    function handleSelection(box) {
        if (timeoutId || box.classList.contains("matched") || box === firstSelection) {
        return;
        }
        box.style.borderColor = "yellow";
        if (!firstSelection) {
        firstSelection = box;
        } else if (!secondSelection) {
        secondSelection = box;

        //WHEN MATCHED, TURN GRAY
        if (firstSelection.dataset.color === secondSelection.dataset.color) {
            firstSelection.classList.add("matched");
            secondSelection.classList.add("matched");
            firstSelection.style.backgroundColor = "gray";
            secondSelection.style.backgroundColor = "gray";
            firstSelection.style.borderColor = "gray";
            secondSelection.style.borderColor = "gray";
            matches++;
            firstSelection = null;
            secondSelection = null;
            if (matches === totalMatches) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "You matched all colors! Well done!";
            awardSquares(matches);
            }
        }

        //NOT A MATCH, TURN BOTH BORDERS RED TO SIGNAL
        else {
            firstSelection.style.borderColor = "red";
            secondSelection.style.borderColor = "red";
            timeoutId = setTimeout(() => {
            if (firstSelection) firstSelection.style.borderColor = "black";
            if (secondSelection) secondSelection.style.borderColor = "black";
            firstSelection = null;
            secondSelection = null;
            timeoutId = null;
            }, 700);
        }
        }
    }

    //WHEN START BUTTON IS PRESSED, SHOW GAME AREA AND START LOGIC
    startBtn.addEventListener("click", () => {
        gameArea.style.display = "block";
        startBtn.style.display = "none";

        //SHUFFLE COLORS
        let leftColors = shuffle(colors);
        let rightColors = shuffle(colors);

        //APPEND BOXES TO LEFT AND RIGHT COLUMNS
        leftColors.forEach((color) => {
        const box = createBox(color);
        leftCol.appendChild(box);
        });
        rightColors.forEach((color) => {
        const box = createBox(color);
        rightCol.appendChild(box);
        });

        //ACTIVATE CLICK EVENTS
        container.querySelectorAll(".memory-box").forEach((box) => {
        box.addEventListener("click", () => handleSelection(box));
        });
        updateTimer();
        timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            endChallenge();
        } else {
            updateTimer();
        }
        }, 1000);
    });
    }

  //SHOW THE MODAL
  modal.style.display = "block";
}

//CLOSE THE CHALLENGE MODAL, DISABLE TYPING INPUT IF OPEN
function closeModal() {
  const modal = document.getElementById("challengeModal");
  modal.style.display = "none";

  //DISABLE TYPING INPUT IF IT EXISTS
  const input = document.getElementById("typingInput");
  if (input) input.disabled = true;
}
