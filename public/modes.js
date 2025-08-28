//DG964
//TRACK LAST MOVE DIRECTION
let lastDirection = 'down';
document.addEventListener('keydown', (e) => {
    if (['w','a','s','d'].includes(e.key)) lastDirection = e.key;
});

//PAINT CELL UTILITY AND NETWORK SYNC
function paintCell(row, col, teamColor) {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;
    const cell = gridArray[row][col];
    cell.classList.remove('red','blue','green','yellow');
    if (teamColor) cell.classList.add(teamColor);
    sendMessage(JSON.stringify({
        type: 'update',
        x: row,
        y: col,
        color: teamColor
    }));
}

//SABOTAGE
const sabotageFunctions = {
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

    Blockade: (teamColor) => {
        if (!currentCell) return;
        let row = parseInt(currentCell.dataset.row);
        let col = parseInt(currentCell.dataset.col);
        paintCell(row, col, teamColor);
        let delta = lastDirection === 'a' || lastDirection === 'd' ? 'vertical' : 'horizontal';
        let offsets = [-2,-1,1,2];
        offsets.forEach(o => {
            if (delta === 'horizontal') paintCell(row, col + o, teamColor);
            else paintCell(row + o, col, teamColor);
        });
    },

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
                if ((cell.classList.contains('red') || cell.classList.contains('blue') || cell.classList.contains('green') || cell.classList.contains('yellow')) && !cell.classList.contains(player.color)) {
                    paintCell(newRow, newCol, player.color);
                }
            });
        });
    }
};

//SABOTAGE NOTIFICATION ELEMENT SETUP
const sabotageNotification = document.createElement("div");
sabotageNotification.id = "sabotageNotification";
sabotageNotification.style.position = "absolute";
sabotageNotification.style.top = "30%";
sabotageNotification.style.left = "20px";
sabotageNotification.style.width = "150px";
sabotageNotification.style.minHeight = "30px";
sabotageNotification.style.background = "#fff3c0";
sabotageNotification.style.border = "2px solid #ffa500";
sabotageNotification.style.padding = "6px";
sabotageNotification.style.fontSize = "14px";
sabotageNotification.style.fontWeight = "bold";
sabotageNotification.style.textAlign = "center";
sabotageNotification.style.borderRadius = "6px";
sabotageNotification.style.zIndex = "1000";
sabotageNotification.style.display = "none";
document.body.appendChild(sabotageNotification);

//SABOTAGE STORAGE BOX SETUP
const sabotageStorageBox = document.createElement("div");
sabotageStorageBox.id = "sabotageStorageBox";
sabotageStorageBox.style.position = "absolute";
sabotageStorageBox.style.top = "50%";
sabotageStorageBox.style.transform = "translateY(-50%)";
sabotageStorageBox.style.left = "20px";
sabotageStorageBox.style.width = "150px";
sabotageStorageBox.style.minHeight = "120px";
sabotageStorageBox.style.background = "#f0f0f0";
sabotageStorageBox.style.border = "2px solid #444";
sabotageStorageBox.style.padding = "6px";
sabotageStorageBox.style.display = "flex";
sabotageStorageBox.style.flexDirection = "column";
sabotageStorageBox.style.gap = "6px";
sabotageStorageBox.style.zIndex = "999";
document.body.appendChild(sabotageStorageBox);
const sabotageTitle = document.createElement("div");
sabotageTitle.style.fontWeight = "bold";
sabotageTitle.textContent = "Sabotages";
sabotageStorageBox.appendChild(sabotageTitle);
const sabotageListContainer = document.createElement("div");
sabotageListContainer.id = "sabotageListContainer";
sabotageListContainer.style.display = "flex";
sabotageListContainer.style.flexDirection = "column";
sabotageListContainer.style.gap = "4px";
sabotageStorageBox.appendChild(sabotageListContainer);
const sabotageList = ["Strikethrough","Blockade","Patch","Convert"];
const sabotageCounts = {};
sabotageList.forEach(s => sabotageCounts[s] = 0);
let activeOption = null;

//RENDER SABOTAGE STORAGE BUTTONS
function renderSabotageStorage() {
    sabotageListContainer.innerHTML = "";
    sabotageList.forEach(name => {
        const count = sabotageCounts[name] || 0;
        const btn = document.createElement("button");
        btn.style.display = "flex";
        btn.style.justifyContent = "space-between";
        btn.style.alignItems = "center";
        btn.style.padding = "6px";
        btn.style.fontSize = "13px";
        btn.style.cursor = count > 0 ? "pointer" : "default";
        btn.textContent = name;
        const badge = document.createElement("span");
        badge.textContent = count;
        badge.style.marginLeft = "8px";
        badge.style.fontWeight = "bold";
        btn.appendChild(badge);
        if (activeOption === name) {
            btn.style.outline = "2px solid #0066ff";
            btn.style.background = "#e6f0ff";
            btn.style.fontWeight = "bold";
        } 
        else {
            btn.style.outline = "none";
            btn.style.background = "";
            btn.style.fontWeight = "normal";
        }
        btn.onclick = () => {
            if (count <= 0) return;
            activeOption = name;
            renderSabotageStorage();
        };
        sabotageListContainer.appendChild(btn);
    });
}
renderSabotageStorage();

//ADD SABOTAGE TO STORAGE
function addSabotage(type, amount = 1) {
    if (!sabotageCounts.hasOwnProperty(type)) return;
    sabotageCounts[type] = (sabotageCounts[type] || 0) + amount;
    renderSabotageStorage();
}

//RANDOMLY AWARD SABOTAGE
function maybeAwardSabotage() {
    const roll = Math.random();
    if (roll < 0.5) {
        sabotageNotification.textContent = "No sabotage won this time.";
        sabotageNotification.style.display = "block";
        setTimeout(() => sabotageNotification.style.display = "none", 2500);
        return;
    }
    const choice = sabotageList[Math.floor(Math.random() * sabotageList.length)];
    addSabotage(choice, 1);
    sabotageNotification.textContent = `You won a ${choice} sabotage!`;
    sabotageNotification.style.display = "block";
    setTimeout(() => sabotageNotification.style.display = "none", 2500);
}

//USE ACTIVE SABOTAGE
function useActiveSabotage() {
    if (!activeOption) return;
    const count = sabotageCounts[activeOption] || 0;
    if (count <= 0) return;
    if (!sabotageFunctions[activeOption]) return;
    if (!player || !player.color || !currentCell) return;
    sabotageFunctions[activeOption](player.color);
    sabotageCounts[activeOption] = Math.max(0, sabotageCounts[activeOption] - 1);
    if (sabotageCounts[activeOption] <= 0) activeOption = null;
    renderSabotageStorage();
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'e') useActiveSabotage();
});
