let players = [];
let currentPlayerIndex = 0;
let gameStarted = false;
let awaitingChallenge = false;
let usedQuestions = [];
let usedChallenges = [];
let currentQuestion = null;
let currentChallenge = null;

function setupPlayers() {
    let numPlayers = parseInt(document.getElementById("numPlayers").value);
    if (numPlayers < 2 || numPlayers > 6 || isNaN(numPlayers)) {
        alert("يرجى اختيار عدد بين 2 و6!");
        return;
    }

    let playerNamesDiv = document.getElementById("playerNames");
    playerNamesDiv.innerHTML = "";
    players = [];

    for (let i = 0; i < numPlayers; i++) {
        let input = document.createElement("input");
        input.type = "text";
        input.placeholder = `اسم اللاعب ${i + 1}`;
        input.id = `player${i}`;
        playerNamesDiv.appendChild(input);
    }

    document.getElementById("startGameBtn").style.display = "block";
}

function startGame() {
    let numPlayers = parseInt(document.getElementById("numPlayers").value);
    for (let i = 0; i < numPlayers; i++) {
        let name = document.getElementById(`player${i}`).value.trim();
        if (!name) {
            alert("يرجى إدخال جميع الأسماء!");
            return;
        }
        players.push({ name: name, score: 0, safeCards: 0, thiefCards: 0 });
    }

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "flex";
    gameStarted = true;
    updatePlayersList();
    setCurrentPlayer();
}

function updatePlayersList() {
    let list = document.getElementById("playersList");
    list.innerHTML = "";
    players.forEach((p) => {
        let div = document.createElement("div");
        div.className = "player-box";
        div.innerHTML = `<span>${p.name}: ${p.score} نقاط</span>`;
        let cardsDiv = document.createElement("div");
        cardsDiv.className = "player-cards";
        
        for (let i = 0; i < p.safeCards; i++) {
            let cardSlot = document.createElement("div");
            cardSlot.className = "card-slot";
            cardSlot.innerHTML = `
                <span>ما أتوهق</span>
                <img src="https://cdn-icons-png.flaticon.com/512/2942/2942411.png" alt="ما أتوهق">
            `;
            cardSlot.onclick = () => useSafeCardFromPlayer(p.name);
            cardsDiv.appendChild(cardSlot);
        }
        
        for (let i = 0; i < p.thiefCards; i++) {
            let cardSlot = document.createElement("div");
            cardSlot.className = "card-slot";
            cardSlot.innerHTML = `
                <span>حرامي</span>
                <img src="https://cdn-icons-png.flaticon.com/512/2632/2632862.png" alt="حرامي">
            `;
            cardSlot.onclick = () => askToUseThiefCardFromPlayer(p.name);
            cardsDiv.appendChild(cardSlot);
        }
        
        div.appendChild(cardsDiv);
        list.appendChild(div);
    });
}

function setCurrentPlayer() {
    document.getElementById("currentPlayer").innerHTML = `جاهز يا ${players[currentPlayerIndex].name}`;
    updatePlayersList();
    if (players[currentPlayerIndex].thiefCards > 0) {
        askToUseThiefCard();
    } else {
        resetCardForQuestion();
    }
}

function resetCardForQuestion() {
    if (!gameStarted || awaitingChallenge) return;

    let card = document.getElementById("card");
    card.className = "card question";
    card.innerHTML = "جاوب وخذها";
    card.onclick = null; // مسح الحدث السابق

    let availableQuestions = questionCards.filter(q => !usedQuestions.includes(q));
    if (availableQuestions.length > 0) {
        currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        usedQuestions.push(currentQuestion);
    } else {
        currentQuestion = questionCards[Math.floor(Math.random() * questionCards.length)];
    }

    card.onclick = showQuestion;
}

function showQuestion() {
    if (!gameStarted || awaitingChallenge) return;

    let card = document.getElementById("card");
    card.classList.add("revealed");
    
    // تحقق من وجود حقل media وعرض الصورة مع حدث النقر
    let mediaHtml = "";
    if (currentQuestion.media && currentQuestion.media.type === "image") {
        mediaHtml = `<img src="${currentQuestion.media.src}" alt="صورة السؤال" class="question-image" onclick="showImagePopup('${currentQuestion.media.src}')">`;
    }

    card.innerHTML = `
        <p>كرت سؤال</p>
        <p>${currentQuestion.question}</p>
        ${mediaHtml}
        <button id="showAnswerBtn">اظهر الإجابة</button>
        <button id="zoomBtn" class="zoom-btn">تكبير</button>
        ${usedQuestions.length > questionCards.length ? "<p>ملاحظة: سؤال مكرر</p>" : ""}
    `;
    card.onclick = null;

    document.getElementById("showAnswerBtn").onclick = () => showAnswer(currentQuestion.question, currentQuestion.answer);
    document.getElementById("zoomBtn").onclick = () => zoomQuestion(currentQuestion.question);
}
function closePopup() {
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.classList.remove("active");
    overlay.classList.remove("active");
}
// دالة جديدة لعرض الصورة في popup
function showImagePopup(imageSrc) {
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.innerHTML = `
        <img src="${imageSrc}" alt="صورة مكبرة" class="popup-image">
    `;
    popup.classList.add("active");
    overlay.classList.add("active");

    // إغلاق الـpopup عند النقر على الـoverlay
    overlay.onclick = closePopup;
}

function zoomQuestion(question) {
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.innerHTML = `<p>${question}</p>`;
    popup.classList.add("active");
    overlay.classList.add("active");
}

function closePopup() {
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.classList.remove("active");
    overlay.classList.remove("active");
}

function showAnswer(question, correctAnswer) {
    let card = document.getElementById("card");
    card.innerHTML = `
        <p>كرت سؤال</p>
        <p>${question}</p>
        <p>الإجابة: ${correctAnswer}</p>
        <p>جاوب صح أو غلط؟</p>
        <button id="correctBtn">صح</button>
        <button id="wrongBtn">غلط</button>
    `;
    
    document.getElementById("correctBtn").onclick = () => voteAnswer(true);
    document.getElementById("wrongBtn").onclick = () => voteAnswer(false);
}

function voteAnswer(isCorrect) {
    let card = document.getElementById("card");
    if (isCorrect) {
        players[currentPlayerIndex].score++;
        card.innerHTML = `
            <p class="encouragement">يا سلام عليك! إجابة صحيحة!</p>
            <p>نقطة جديدة يا نجم!</p>
        `;
        checkWinner();
        setTimeout(nextPlayer, 1500);
    } else {
        card.innerHTML = `
            <p>إجابة خاطئة!</p>
            <p>تحضير كرت وهقني...</p>
        `;
        setTimeout(drawChallengeCard, 1500);
    }
    updatePlayersList();
}

function drawChallengeCard() {
    if (!gameStarted) return;

    let card = document.getElementById("card");
    card.className = "card challenge";
    card.innerHTML = "وهقني";
    card.onclick = null;

    let availableChallenges = challengeCards.filter(c => !usedChallenges.includes(c));
    if (availableChallenges.length > 0) {
        currentChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        usedChallenges.push(currentChallenge);
    } else {
        currentChallenge = challengeCards[Math.floor(Math.random() * challengeCards.length)];
    }

    card.onclick = showChallenge;
}

function showChallenge() {
    if (!gameStarted) return;

    let card = document.getElementById("card");
    card.classList.add("revealed");
    card.innerHTML = `
        <p>كرت وهقني</p>
        <p>${currentChallenge}</p>
        ${usedChallenges.length > challengeCards.length ? "<p>ملاحظة: تحدي مكرر</p>" : ""}
    `;
    card.onclick = null;

    if (currentChallenge === "كرت ما أتوهق: يمكنك تخطي تحدٍ لاحقًا") {
        let button = document.createElement("button");
        button.textContent = "استلمت الكرت";
        button.onclick = () => confirmCardReceived('safe');
        card.appendChild(button);
    } else if (currentChallenge === "كرت حرامي: يمكنك سرقة كرت ما أتوهق من لاعب آخر") {
        let button = document.createElement("button");
        button.textContent = "استلمت الكرت";
        button.onclick = () => confirmCardReceived('thief');
        card.appendChild(button);
    } else if (currentChallenge.includes("كرت توهق معاي")) {
        let otherPlayers = players.filter(p => p.name !== players[currentPlayerIndex].name);
        if (otherPlayers.length === 0) {
            card.innerHTML += `<p>لا يوجد لاعبون آخرون للتحدي!</p>`;
        } else {
            let prompt = document.createElement("p");
            prompt.textContent = "اختر لاعبًا للتحدي!";
            card.appendChild(prompt);
            otherPlayers.forEach(p => {
                let button = document.createElement("button");
                button.textContent = p.name;
                button.onclick = () => startChallengeDuel(p.name);
                card.appendChild(button);
            });
        }
    } else if (currentChallenge.includes("كرت أتحداك")) {
        let otherPlayers = players.filter(p => p.name !== players[currentPlayerIndex].name);
        if (otherPlayers.length === 0) {
            card.innerHTML += `<p>لا يوجد لاعبون آخرون للتحدي!</p>`;
        } else {
            let prompt = document.createElement("p");
            prompt.textContent = "اختر لاعبًا للتحدي!";
            card.appendChild(prompt);
            otherPlayers.forEach(p => {
                let button = document.createElement("button");
                button.textContent = p.name;
                button.onclick = () => startDareChallenge(p.name);
                card.appendChild(button);
            });
        }
    } else if (currentChallenge.includes("كرت التمثيل")) {
        let button = document.createElement("button");
        button.textContent = "تم التمثيل";
        button.onclick = () => askIfPerformedWell();
        card.appendChild(button);
    } else if (currentChallenge.includes("كرت الحكم")) {
        let button = document.createElement("button");
        button.textContent = "تم التنفيذ";
        button.onclick = () => askIfJudgmentPassed();
        card.appendChild(button);
    } else {
        let yesButton = document.createElement("button");
        yesButton.textContent = "نعم";
        yesButton.onclick = () => challengeCompleted(true);
        card.appendChild(yesButton);

        let noButton = document.createElement("button");
        noButton.textContent = "لا";
        noButton.onclick = () => challengeCompleted(false);
        card.appendChild(noButton);

        awaitingChallenge = true;
    }
}

function startChallengeDuel(targetName) {
    let card = document.getElementById("card");
    card.innerHTML = `
        <p>كرت توهق معاي</p>
        <p>${currentChallenge}</p>
        <p>تم التحدي بين ${players[currentPlayerIndex].name} و ${targetName}</p>
    `;
    
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.innerHTML = `
        <p>توهق معاي: ${currentChallenge}</p>
        <p>من فاز بالتحدي؟</p>
        <button id="currentWonBtn">${players[currentPlayerIndex].name}</button>
        <button id="targetWonBtn">${targetName}</button>
    `;
    popup.classList.add("active");
    overlay.classList.add("active");

    document.getElementById("currentWonBtn").onclick = () => resolveDuel(players[currentPlayerIndex].name, targetName, true);
    document.getElementById("targetWonBtn").onclick = () => resolveDuel(players[currentPlayerIndex].name, targetName, false);
}

function resolveDuel(currentPlayerName, targetName, currentWon) {
    let currentPlayer = players.find(p => p.name === currentPlayerName);
    let target = players.find(p => p.name === targetName);
    let card = document.getElementById("card");
    
    if (currentWon) {
        currentPlayer.score += 2;
        card.innerHTML = `
            <p class="encouragement">${currentPlayerName} فاز!</p>
            <p>حصل على نقطتين!</p>
        `;
    } else {
        target.score += 2;
        card.innerHTML = `
            <p class="encouragement">${targetName} فاز!</p>
            <p>حصل على نقطتين!</p>
        `;
    }
    
    closePopup();
    updatePlayersList();
    checkWinner();
    setTimeout(nextPlayer, 1500);
}

function startDareChallenge(targetName) {
    let card = document.getElementById("card");
    card.innerHTML = `
        <p>كرت أتحداك</p>
        <p>${currentChallenge}</p>
        <p>تم التحدي بين ${players[currentPlayerIndex].name} و ${targetName}</p>
    `;
    
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.innerHTML = `
        <p>من فاز بالتحدي؟</p>
        <button id="currentWonBtn">${players[currentPlayerIndex].name}</button>
        <button id="targetWonBtn">${targetName}</button>
    `;
    popup.classList.add("active");
    overlay.classList.add("active");

    document.getElementById("currentWonBtn").onclick = () => resolveDare(players[currentPlayerIndex].name, targetName, true);
    document.getElementById("targetWonBtn").onclick = () => resolveDare(players[currentPlayerIndex].name, targetName, false);
}

function resolveDare(currentPlayerName, targetName, currentWon) {
    let currentPlayer = players.find(p => p.name === currentPlayerName);
    let target = players.find(p => p.name === targetName);
    let card = document.getElementById("card");
    
    if (currentWon) {
        currentPlayer.score += 1;
        card.innerHTML = `
            <p class="encouragement">${currentPlayerName} فاز!</p>
            <p>حصل على نقطة!</p>
        `;
    } else {
        target.score += 1;
        card.innerHTML = `
            <p class="encouragement">${targetName} فاز!</p>
            <p>حصل على نقطة!</p>
        `;
    }
    
    closePopup();
    updatePlayersList();
    checkWinner();
    setTimeout(nextPlayer, 1500);
}

function askIfPerformedWell() {
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.innerHTML = `
        <p>هل مثل ${players[currentPlayerIndex].name} عدل؟</p>
        <button id="yesBtn">نعم</button>
        <button id="noBtn">لا</button>
    `;
    popup.classList.add("active");
    overlay.classList.add("active");

    document.getElementById("yesBtn").onclick = () => resolvePerformance(true);
    document.getElementById("noBtn").onclick = () => resolvePerformance(false);
}


function askIfJudgmentPassed() {
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.innerHTML = `
        <p>${players[currentPlayerIndex].name} نفذ الحكم؟</p>
        <button id="yesBtn">نعم</button>
        <button id="noBtn">لا</button>
    `;
    popup.classList.add("active");
    overlay.classList.add("active");

    document.getElementById("yesBtn").onclick = () => resolveJudgment(true);
    document.getElementById("noBtn").onclick = () => resolveJudgment(false);
}

// دالة لمعالجة نتيجة كرت الحكم
function resolveJudgment(passed) {
    let card = document.getElementById("card");
    if (passed) {
        players[currentPlayerIndex].score += 1;
        card.innerHTML = `
            <p class="encouragement">نفذت الحكم بنجاح!</p>
            <p>نقطة جديدة!</p>
        `;
    } else {
        players[currentPlayerIndex].score = Math.max(0, players[currentPlayerIndex].score - 1); // خسارة نقطة مع ضمان عدم السالب
        card.innerHTML = `
            <p>ما نفذت الحكم!</p>
            <p>خسرت نقطة!</p>
        `;
    }
    
    closePopup();
    updatePlayersList();
    checkWinner();
    setTimeout(nextPlayer, 1500);
}

// دالة لمعالجة نتيجة كرت التمثيل
function resolvePerformance(performedWell) {
    let card = document.getElementById("card");
    if (performedWell) {
        players[currentPlayerIndex].score += 1;
        card.innerHTML = `
            <p class="encouragement">تمثيل رائع!</p>
            <p>نقطة جديدة!</p>
        `;
    } else {
        players[currentPlayerIndex].score = Math.max(0, players[currentPlayerIndex].score - 1); // خسارة نقطة مع ضمان عدم السالب
        card.innerHTML = `
            <p>التمثيل ما كان مقنع!</p>
            <p>خسرت نقطة!</p>
        `;
    }
    
    closePopup();
    updatePlayersList();
    checkWinner();
    setTimeout(nextPlayer, 1500);
}

function confirmCardReceived(cardType) {
    if (cardType === "safe" && !players[currentPlayerIndex].justReceivedSafe) {
        players[currentPlayerIndex].safeCards++;
        players[currentPlayerIndex].justReceivedSafe = true;
    } else if (cardType === "thief" && !players[currentPlayerIndex].justReceivedThief) {
        players[currentPlayerIndex].thiefCards++;
        players[currentPlayerIndex].justReceivedThief = true;
    }
    updatePlayersList();
    nextPlayer();
}

function challengeCompleted(completed) {
    awaitingChallenge = false;
    let card = document.getElementById("card");
    if (completed) {
        players[currentPlayerIndex].score++;
        card.innerHTML = `
            <p class="encouragement">ما شاء الله! أداء رائع!</p>
            <p>نقطة جديدة يا بطل!</p>
        `;
    } else {
        card.innerHTML = `
            <p>ما نفذت؟ لا بأس!</p>
            <p>لا نقاط هذه المرة.</p>
        `;
    }
    updatePlayersList();
    checkWinner();
    setTimeout(nextPlayer, 1500);
}

function useSafeCardFromPlayer(playerName) {
    let player = players.find(p => p.name === playerName);
    if (player.name === players[currentPlayerIndex].name && player.safeCards > 0 && awaitingChallenge) {
        player.safeCards--;
        let card = document.getElementById("card");
        card.innerHTML = `
            <p>استخدمت كرت ما أتوهق!</p>
            <p>تم تخطي كرت وهقني!</p>
        `;
        awaitingChallenge = false;
        updatePlayersList();
        setTimeout(nextPlayer, 1500);
    } else if (player.name === players[currentPlayerIndex].name && !awaitingChallenge) {
        alert("ما في كرت وهقني لتخطيه الآن!");
    }
}

function askToUseThiefCardFromPlayer(playerName) {
    let player = players.find(p => p.name === playerName);
    if (player.name === players[currentPlayerIndex].name && player.thiefCards > 0) {
        askToUseThiefCard();
    }
}

function askToUseThiefCard() {
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");
    popup.innerHTML = `
        <p>هل تريد استخدام كرت الحرامي لسرقة كرت ما أتوهق؟</p>
        <button id="yesBtn">نعم</button>
        <button id="noBtn">لا</button>
    `;
    popup.classList.add("active");
    overlay.classList.add("active");

    document.getElementById("yesBtn").onclick = () => useThiefCard(true);
    document.getElementById("noBtn").onclick = () => useThiefCard(false);
}

function useThiefCard(use) {
    closePopup();
    if (!use) {
        resetCardForQuestion();
        return;
    }

    let playersWithSafe = players.filter(p => p.safeCards > 0 && p.name !== players[currentPlayerIndex].name);
    let popup = document.getElementById("popup");
    let overlay = document.getElementById("overlay");

    if (playersWithSafe.length > 0) {
        let options = playersWithSafe.map(p => `<button onclick="stealSafeCard('${p.name}')">${p.name} (${p.safeCards} ما أتوهق)</button>`).join("");
        popup.innerHTML = `
            <p>اختر لاعب لسرقة كرت ما أتوهق منه:</p>
            ${options}
        `;
        popup.classList.add("active");
        overlay.classList.add("active");
    } else {
        popup.innerHTML = `
            <p>ما في لاعبين عندهم كرت ما أتوهق لسرقته!</p>
            <button id="okBtn">تمام</button>
        `;
        popup.classList.add("active");
        overlay.classList.add("active");
        document.getElementById("okBtn").onclick = closePopupAndContinue;
    }
}

function closePopupAndContinue() {
    closePopup();
    resetCardForQuestion();
}

function stealSafeCard(targetName) {
    let target = players.find(p => p.name === targetName);
    let currentPlayer = players[currentPlayerIndex];
    if (target && target.safeCards > 0 && currentPlayer.thiefCards > 0) {
        target.safeCards--;
        currentPlayer.thiefCards--;
        currentPlayer.safeCards++;
        let card = document.getElementById("card");
        card.innerHTML = `
            <p class="encouragement">سرقت كرت ما أتوهق من ${targetName}!</p>
            <p>تمت السرقة بنجاح!</p>
        `;
        updatePlayersList();
        setTimeout(() => {
            closePopup();
            resetCardForQuestion();
        }, 2000);
    }
}

function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    let card = document.getElementById("card");
    card.innerHTML = "";
    card.onclick = null;
    awaitingChallenge = false;
    players[currentPlayerIndex].justReceivedSafe = false;
    players[currentPlayerIndex].justReceivedThief = false;
    setCurrentPlayer();
}

function checkWinner() {
    let winner = players.find(p => p.score >= 10);
    if (winner) {
        let card = document.getElementById("card");
        card.className = "card question revealed";
        card.innerHTML = `
            <p class="encouragement">مبروك يا ${winner.name}!</p>
            <p>فزت برصيد ${winner.score} نقاط!</p>
        `;
        gameStarted = false;
    }
}