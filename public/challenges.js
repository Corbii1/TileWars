//DG964
function awardSquares(amount = 7) {
    tileBank = Math.min(tileBank + amount, 20);
    updateTileBankUI();
}

let challengeCooldown = 0;
const challengeCooldownMax = 15;
const challengeMenu = document.getElementById("challengeDropdown");

//UPDATE DROPDOWN COLOR AND ENABLE/DISABLE BASED ON COOLDOWN
function updateDropdownColor() {
    if (challengeCooldown <= 0) {
        challengeMenu.style.backgroundColor = "lightgreen";
        challengeMenu.disabled = false;
    } 
    else {
        challengeMenu.style.backgroundColor = "lightcoral";
        challengeMenu.disabled = true;
    }
}

//COOLDOWN TIMER TICK
setInterval(() => {
    if (challengeCooldown > 0) {
        challengeCooldown--;
        updateDropdownColor();
    }
}, 1000);

function startChallenge(type) {
    if (challengeCooldown > 0) return;
    challengeCooldown = challengeCooldownMax;
    updateDropdownColor();
    const modal = document.getElementById("challengeModal");
    const container = document.getElementById("challengeContainer");
    container.innerHTML = "";

    //TYPING CHALLENGE SETUP
    if (type === "typing") {
        const letters = "abcdefghijklmnopqrstuvwxyz";
        let randomString = "";
        for (let i = 0; i < 15; i++) randomString += letters[Math.floor(Math.random() * letters.length)];
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
        input.disabled = true;
        let challengeStarted = false;
        let challengeEnded = false;
        let timerInterval;
        let timeLeft = 7;

        function updateFeedback() {
            const typed = input.value;
            let result = "";
            for (let i = 0; i < typed.length; i++) {
                if (typed[i] === randomString[i]) result += `<span style="color: green;">${typed[i]}</span>`;
                else result += `<span style="color: red;">${typed[i]}</span>`;
            }
            let rest = randomString.slice(typed.length);
            result += `<span style="color: gray;">${rest}</span>`;
            feedback.innerHTML = result;
        }

        function updateTimer() { timerDisplay.textContent = `Time left: ${timeLeft}s`; }

        //END TYPING CHALLENGE AND AWARD TILES
        function endChallenge() {
            if (challengeEnded) return;
            challengeEnded = true;
            input.disabled = true;
            startBtn.style.display = "none";
            timerDisplay.textContent = "Time's up!";
            const typed = input.value;
            let correctCount = 0;
            for (let i = 0; i < typed.length; i++) if (typed[i] === randomString[i]) correctCount++;
            resultDiv.textContent = `You typed ${correctCount} letters correctly!`;
            awardSquares();
            if (typeof maybeAwardSabotage === 'function') {
                try { maybeAwardSabotage(); } catch (err) { console.warn("maybeAwardSabotage failed:", err); }
            }
        }
        startBtn.addEventListener("click", () => {
            if (challengeStarted) return;
            challengeStarted = true;
            input.disabled = false;
            input.focus();
            startBtn.style.display = "none";
            updateTimer();
            timerInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) { clearInterval(timerInterval); endChallenge(); }
                else updateTimer();
            }, 1000);
        });

        //CHECK INPUT AND END EARLY IF COMPLETED
        input.addEventListener("input", () => {
            if (!challengeStarted || challengeEnded) return;
            updateFeedback();
            if (input.value.length >= randomString.length) {
                clearInterval(timerInterval);
                endChallenge();
            }
        });
        updateFeedback();
    }

    //COLOR IDENTIFICATION CHALLENGE
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
        let allowClick = true;

        function rgbToCss(rgb) { return `rgb(${rgb.r},${rgb.g},${rgb.b})`; }

        function getSlightlyDifferentColor(color) {
            const variation = 120;
            let newColor = { ...color };
            const channels = ["r", "g", "b"];
            let firstIndex = Math.floor(Math.random() * 3);
            let secondIndex;
            do { secondIndex = Math.floor(Math.random() * 3); } while (secondIndex === firstIndex);
            [channels[firstIndex], channels[secondIndex]].forEach(channel => {
                if (Math.random() < 0.5) newColor[channel] = Math.max(0, color[channel] - variation);
                else newColor[channel] = Math.min(255, color[channel] + variation);
            });
            return newColor;
        }

        //START EACH ROUND OF COLOR TEST
        function startRound() {
            boxesContainer.innerHTML = "";
            resultDiv.textContent = "";
            boxesContainer.style.borderColor = "transparent";
            allowClick = true;
            if (currentRound >= totalRounds) { endChallenge(); return; }
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
                box.style.backgroundColor = (i === oddIndex) ? rgbToCss(diffColor) : rgbToCss(baseColor);
                box.dataset.isOdd = (i === oddIndex) ? "true" : "false";
                box.addEventListener("click", () => {
                    if (!allowClick) return;
                    if (box.dataset.isOdd === "true") {
                        box.style.borderColor = "green";
                        score++;
                        currentRound++;
                        allowClick = false;
                        setTimeout(startRound, 500);
                    } 
                    else boxesContainer.style.borderColor = "red";
                });
                boxesContainer.appendChild(box);
            }
        }

        function endChallenge() {
            clearInterval(timerInterval);
            boxesContainer.innerHTML = "";
            timerDisplay.textContent = "Time's up!";
            resultDiv.textContent = `You found ${score} out of ${totalRounds} correct!`;
            awardSquares();
            if (typeof maybeAwardSabotage === 'function') {
                try { maybeAwardSabotage(); } catch (err) { console.warn("maybeAwardSabotage failed:", err); }
            }
        }
        startBtn.addEventListener("click", () => {
            startBtn.style.display = "none";
            startRound();
            timerInterval = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = `Time left: ${timeLeft}s`;
                if (timeLeft <= 0) { clearInterval(timerInterval); endChallenge(); }
            }, 1000);
        });
    }

    //MEMORY MATCHING CHALLENGE
    else if (type === "memory") {
        const colors = ["red","green","blue","yellow"];
        const totalMatches = colors.length;
        let matches = 0;
        let firstSelection = null;
        let secondSelection = null;
        let timeoutId = null;
        let timeLeft = 7;
        let timerInterval = null;

        function shuffle(array) {
            return array.map(a => ({ sort: Math.random(), value: a }))
                        .sort((a,b) => a.sort - b.sort)
                        .map(a => a.value);
        }
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

        function updateTimer() { timerDisplay.textContent = `Time left: ${timeLeft}s`; }

        //END MEMORY CHALLENGE
        function endChallenge() {
            clearInterval(timerInterval);
            timerDisplay.textContent = "Time's up!";
            container.querySelectorAll(".memory-box").forEach(box => box.style.pointerEvents = "none");
            resultDiv.textContent = `You matched ${matches} of ${totalMatches} colors!`;
            awardSquares();
            if (typeof maybeAwardSabotage === 'function') {
                try { maybeAwardSabotage(); } catch (err) { console.warn("maybeAwardSabotage failed:", err); }
            }
        }

        function resetSelections() {
            if (firstSelection && secondSelection) {
                firstSelection.style.borderColor = "black";
                secondSelection.style.borderColor = "black";
                firstSelection = null;
                secondSelection = null;
            }
        }

        function handleSelection(box) {
            if (timeoutId || box.classList.contains("matched") || box === firstSelection) return;
            box.style.borderColor = "yellow";
            if (!firstSelection) firstSelection = box;
            else if (!secondSelection) {
                secondSelection = box;
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
                        awardSquares();
                        if (typeof maybeAwardSabotage === 'function') {
                            try { maybeAwardSabotage(); } catch (err) { console.warn("maybeAwardSabotage failed:", err); }
                        }
                    }
                } 
                else {
                    firstSelection.style.borderColor = "red";
                    secondSelection.style.borderColor = "red";
                    timeoutId = setTimeout(() => { resetSelections(); timeoutId = null; }, 700);
                }
            }
        }
        startBtn.addEventListener("click", () => {
            gameArea.style.display = "block";
            startBtn.style.display = "none";
            let leftColors = shuffle(colors);
            let rightColors = shuffle(colors);
            leftColors.forEach(color => leftCol.appendChild(createBox(color)));
            rightColors.forEach(color => rightCol.appendChild(createBox(color)));
            container.querySelectorAll(".memory-box").forEach(box => {
                box.addEventListener("click", () => handleSelection(box));
            });
            updateTimer();
            timerInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) endChallenge();
                else updateTimer();
            }, 1000);
        });
    }
    modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById("challengeModal");
    modal.style.display = "none";
    const input = document.getElementById("typingInput");
    if (input) input.disabled = true;
}
updateDropdownColor();
