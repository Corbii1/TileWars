//DG964, FILE FOR SABOTAGES AND REWARDS
//MODE BUTTON SETUP
const modes = ["Sabotage", "Reward"];
let currentModeIndex = 0;
const modeButton = document.getElementById("modeButton");
modeButton.textContent = `Mode: ${modes[currentModeIndex]}`;

//TRACK LAST MOVE DIRECTION
let lastDirection = 'down';
document.addEventListener('keydown', (e) => {
    if (['w','a','s','d'].includes(e.key)) lastDirection = e.key;
});

//PAINT HELPER
function paintCell(row, col, teamColor) {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;
    const cell = gridArray[row][col];
    cell.classList.remove('red','blue','green','yellow');
    cell.classList.add(teamColor);
    sendMessage(JSON.stringify({
        type: 'update',
        x: row,
        y: col,
        color: teamColor
    }));
}

//SABOTAGE FUNCTIONS
const sabotageFunctions = {

    //CREATES 3 TILES OF USERS COLOR STEMMING FROM USERS SQUARE IN WHATEVER DIRECTION THEY LAST MOVES
    Strikethrough: (teamColor) => {
        if (!currentCell) return;
        let row = parseInt(currentCell.dataset.row);
        let col = parseInt(currentCell.dataset.col);
        paintCell(row, col, teamColor);
        if (lastDirection === 'w' || lastDirection === 's') {
            for (let i = 1; i <= 2; i++) {
                let newRow = lastDirection === 'w' ? row - i : row + i;
                paintCell(newRow, col, teamColor);
            }
        } 
        else {
            for (let i = 1; i <= 2; i++) {
                let newCol = lastDirection === 'a' ? col - i : col + i;
                paintCell(row, newCol, teamColor);
            }
        }
    },

    //CREATES A LINE OF 5 TILES STEMMING FROM USERS CURRENT SQUARE, CHANGING DIRECTION TO FORM A WALL BASED ON USERS LAST MOVEMENT
    Blockade: (teamColor) => {
        if (!currentCell) return;
        let row = parseInt(currentCell.dataset.row);
        let col = parseInt(currentCell.dataset.col);
        paintCell(row, col, teamColor);
        let delta = lastDirection === 'a' || lastDirection === 'd' ? 'vertical' : 'horizontal';
        let offsets = [-2,-1,1,2];
        offsets.forEach(o => {
            if (delta === 'horizontal') {
                let newCol = col + o;
                paintCell(row, newCol, teamColor);
            } 
            else {
                let newRow = row + o;
                paintCell(newRow, col, teamColor);
            }
        });
    },

    //CREATES A 3X3 TILE GRID OF USERS COLOR IN FRONT OF THEM, CANNOT OVERTAKE OTHER COLORS
    Patch: (teamColor) => {
        if (!currentCell) return;
        let row = parseInt(currentCell.dataset.row);
        let col = parseInt(currentCell.dataset.col);
        paintCell(row, col, teamColor);
        let rowOffsets = [-1,0,1];
        let colOffsets = [-1,0,1];
        if (lastDirection === 'w') rowOffsets = [-3,-2,-1];
        if (lastDirection === 's') rowOffsets = [1,2,3];
        if (lastDirection === 'a') colOffsets = [-3,-2,-1];
        if (lastDirection === 'd') colOffsets = [1,2,3];
        rowOffsets.forEach(rOff => {
            colOffsets.forEach(cOff => {
                let newRow = row + rOff;
                let newCol = col + cOff;
                if ((newRow === row && newCol === col) || newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) return;
                const cell = gridArray[newRow][newCol];
                if (!cell.classList.contains('red') && !cell.classList.contains('blue') && !cell.classList.contains('green') && !cell.classList.contains('yellow')) {
                    paintCell(newRow, newCol, teamColor);
                }
            });
        });
    },

    //WORKS LIKE PATCH, CHANGES COLOR OF ONLY OPPOSING SQUARES (NOT BLANK ONES) TO YOUR COLOR
    Convert: (teamColor) => {
        if (!currentCell) return;
        let row = parseInt(currentCell.dataset.row);
        let col = parseInt(currentCell.dataset.col);
        paintCell(row, col, teamColor);
        let rowOffsets = [-1,0,1];
        let colOffsets = [-1,0,1];
        if (lastDirection === 'w') rowOffsets = [-3,-2,-1];
        if (lastDirection === 's') rowOffsets = [1,2,3];
        if (lastDirection === 'a') colOffsets = [-3,-2,-1];
        if (lastDirection === 'd') colOffsets = [1,2,3];
        rowOffsets.forEach(rOff => {
            colOffsets.forEach(cOff => {
                let newRow = row + rOff;
                let newCol = col + cOff;
                if ((newRow === row && newCol === col) || newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) return;
                const cell = gridArray[newRow][newCol];
                if ((cell.classList.contains('red') || cell.classList.contains('blue') || cell.classList.contains('green') || cell.classList.contains('yellow')) && !cell.classList.contains(teamColor)) {
                    paintCell(newRow, newCol, teamColor);
                }
            });
        });
    },

    //WORKS LIKE PATCH, CREATES A RANDOM ASSORTMENT OF COLORS IN A 3X3 GRID IN FRONT OF USER
    Chaos: () => {
        if (!currentCell) return;
        let row = parseInt(currentCell.dataset.row);
        let col = parseInt(currentCell.dataset.col);
        const teamColors = ['red','blue','green','yellow'];
        paintCell(row, col, teamColors[Math.floor(Math.random() * teamColors.length)]);
        let rowOffsets = [-1,0,1];
        let colOffsets = [-1,0,1];
        if (lastDirection === 'w') rowOffsets = [-3,-2,-1];
        if (lastDirection === 's') rowOffsets = [1,2,3];
        if (lastDirection === 'a') colOffsets = [-3,-2,-1];
        if (lastDirection === 'd') colOffsets = [1,2,3];
        rowOffsets.forEach(rOff => {
            colOffsets.forEach(cOff => {
                let newRow = row + rOff;
                let newCol = col + cOff;
                if ((newRow === row && newCol === col) || newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) return;
                paintCell(newRow, newCol, teamColors[Math.floor(Math.random() * teamColors.length)]);
            });
        });
    }
};

//REWARD
function grantReward(amount) {
    tileBank = Math.min(tileBank + amount, tileBankMax);
    updateTileBankUI();
}

//OPTIONS MENU SETUP
const optionsMenu = document.createElement("div");
optionsMenu.id = "optionsMenu";
optionsMenu.style.position = "absolute";
optionsMenu.style.top = "150px";
optionsMenu.style.left = "20px";
optionsMenu.style.background = "#ccc";
optionsMenu.style.padding = "5px";
optionsMenu.style.display = "flex";
optionsMenu.style.flexDirection = "column";
optionsMenu.style.gap = "2px";
document.body.appendChild(optionsMenu);
let currentOptionType = modes[currentModeIndex];
let activeOption = null;

//BUILD MENU FUNCTION
function buildMenu(type) {
    optionsMenu.innerHTML = "";
    if (type === "Sabotage") {
        ["Strikethrough","Blockade","Patch","Convert","Chaos"].forEach(name => {
            const btn = document.createElement("button");
            btn.textContent = name;
            btn.onclick = () => {
                activeOption = name;
                Array.from(optionsMenu.children).forEach(b => b.style.fontWeight = "normal");
                btn.style.fontWeight = "bold";
            };
            optionsMenu.appendChild(btn);
        });
    } 
    else if (type === "Reward") {
        const rewardOptions = [
            { name: "+1", amount: 1 },
            { name: "+3", amount: 3 },
            { name: "+5", amount: 5 }];
        rewardOptions.forEach(opt => {
            const btn = document.createElement("button");
            btn.textContent = opt.name;
            btn.onclick = () => {
                grantReward(opt.amount);
            };
            optionsMenu.appendChild(btn);
        });
    }
}

//INITIAL MENU
buildMenu(currentOptionType);

//MODE CHANGE, CLICK BUTTON
modeButton.addEventListener("click", () => {
    currentModeIndex = (currentModeIndex + 1) % modes.length;
    modeButton.textContent = `Mode: ${modes[currentModeIndex]}`;
    currentOptionType = modes[currentModeIndex];
    buildMenu(currentOptionType);
});

//TRIGGER SABOTAGE, CLICK ON WHATEVER ONE YOU WANT, THEN PRESS E TO ACTIVATE
document.addEventListener('keydown', (e) => {
    if (e.key === 'e' && currentOptionType === 'Sabotage' && activeOption) {
        sabotageFunctions[activeOption](player.color);
    }
});
