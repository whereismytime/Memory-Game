// localStorage
function loadUserData() {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : {};
}

function saveUserData(data) {
    localStorage.setItem('userData', JSON.stringify(data));
}

function getCurrentUser() {
    return localStorage.getItem('currentUser') || null;
}

function setCurrentUser(username) {
    localStorage.setItem('currentUser', username);
}

function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

// Bots
function initializeBotData() {
    const initialData = {
        "Anton": { score: 5501 },
        "Vadim": { score: 4500 },
        "Sasha": { score: 3000 },
        "Vladislav": { score: 2500 },
        "Oleg": { score: 1000 }
    };
    
    const userData = loadUserData();
    
    // Проверяем, если боты еще не добавлены
    Object.keys(initialData).forEach(bot => {
        if (!userData[bot]) {
            userData[bot] = initialData[bot];
        }
    });
    
    saveUserData(userData);
}

function updateUserScore(username, score) {
    const userData = loadUserData();
    if (!userData[username]) {
        userData[username] = { score: 0 };
    }
    // Суммируем текущий счет с новым значением и ограничиваем минимумом -9999
    userData[username].score = Math.max(userData[username].score + score, -9999);
    saveUserData(userData);
}

function getUserScore(username) {
    const userData = loadUserData();
    return userData[username] ? userData[username].score : 0;
}

// Обновление таблицы лидеров с сортировкой по очкам
function updateLeaderboard() {
    initializeBotData(); // Инициализация данных ботов

    const userData = loadUserData();
    const leaderboardTable = $('#leaderboard tbody');
    leaderboardTable.empty();

    // Получаем текущего пользователя
    const currentUser = getCurrentUser();

    // Сортируем игроков по убыванию очков
    const sortedUsers = Object.entries(userData).sort((a, b) => b[1].score - a[1].score);

    sortedUsers.forEach(([username, data], index) => {
        const isCurrentUser = username === currentUser;
        const isFirstPlace = index === 0;

        // Определяем, какой класс добавить в зависимости от условий
        const rowClass = isFirstPlace ? 'first-place' : isCurrentUser ? 'current-user' : '';

        leaderboardTable.append(`
            <tr class="${rowClass}">
                <td>${index + 1}</td>
                <td>${username}</td>
                <td>${data.score}</td>
            </tr>
        `);
    });
}

// Код для index.html
$(document).ready(function () {
    initializeBotData();

    const currentUser = getCurrentUser();
    const selectedMode = { mode: 'Normal', gridSize: 8 };

    function updateModeSelection() {
        $('.mode-btn').removeClass('active');
        $(`#${selectedMode.mode.toLowerCase()}-mode`).addClass('active');
        updateGridSelectionOptions();
    }

    function updateGridSelectionOptions() {
        $('.grid-btn').each(function () {
            let baseGridSize = parseInt($(this).data('base-grid'), 10);
            let adjustedGridSize = selectedMode.mode === 'Hard' ? baseGridSize + 2 : baseGridSize;
            $(this).text(`${adjustedGridSize} cards`).data('grid', adjustedGridSize);
        });
    }

    function updateGridSelection() {
        $('.grid-btn').removeClass('active');
        $(`.grid-btn[data-grid="${selectedMode.gridSize}"]`).addClass('active');
    }

    if (currentUser) {
        $('#player-name').hide();
        $('#start-button').text('Start Game').show();
        $('#player-welcome').text(`Welcome, ${currentUser}!`).show();
        $('#logout-container').show();
        updateLeaderboard();
    } else {
        $('#player-welcome').hide();
        $('#start-button').text('Play').show();
        $('#logout-container').hide();
    }

    $('#logout-button').click(function () {
        clearCurrentUser();
        location.reload();
    });

    $('.mode-btn').click(function () {
        selectedMode.mode = $(this).text();
        updateModeSelection();
        updateGridSelectionOptions();
    });

    $('.grid-btn').click(function () {
        selectedMode.gridSize = $(this).data('grid');
        updateGridSelection();
    });

    $('#start-button').click(function () {
        let playerName = $('#player-name').val().trim();

        if (!currentUser) {
            if (!playerName || playerName.length < 3) {
                alert("Please enter a name (minimum 3 characters)");
                return;
            }
            setCurrentUser(playerName);
            updateUserScore(playerName, 0);
            $('#player-welcome').text(`Welcome, ${playerName}!`).show();
            $('#player-name').hide();
            $('#logout-container').show();
        } else {
            playerName = currentUser;
        }

        const mode = selectedMode.mode;
        const gridSize = selectedMode.gridSize;

        window.location.href = `game.html?name=${encodeURIComponent(playerName)}&mode=${encodeURIComponent(mode)}&gridSize=${gridSize}`;
    });

    updateModeSelection();
    updateGridSelectionOptions();
});




// Код для game.html

$(document).ready(function () {
    if (window.location.pathname.includes("game.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const currentUser = getCurrentUser();
        const playerName = currentUser || urlParams.get('name');
        const gameMode = urlParams.get('mode') || "Normal";
        const gridSize = parseInt(urlParams.get('gridSize')) || 8;
        const isHardMode = gameMode === "Хард";

        $('#player-name-display').html(playerName);
        $('#mode-display').html(gameMode);
        $('#grid-size-display').html(`${gridSize} cards`);

        let images = generateImagePairs(gridSize / 2, isHardMode);
        let flippedCards = [];
        let matchedPairs = 0;
        let score = 0;
        let multiplier = isHardMode ? getHardModeMultiplier(gridSize) : getNormalModeMultiplier(gridSize);
        let gameFinished = false; 

        createCards();

        function createCards() {
            const gameBoard = $('#game-board');
            gameBoard.empty();
            
            const columns = Math.ceil(Math.sqrt(gridSize));
            gameBoard.css('grid-template-columns', `repeat(${columns}, 100px)`);
        
            images.forEach(image => {
                const card = $(`<div class="card" data-pair-id="${image.pairId}">
                        <div class="front">?</div>
                        <div class="back" style="background-image: url('${image.src}')"></div>
                    </div>`);
                gameBoard.append(card);
            });
        }

        function generateImagePairs(numPairs, isHardMode) {
            let pairs = [];
        
            
            const bombCount = isHardMode ? getBombCount(numPairs * 2) : 0;
            const adjustedNumPairs = numPairs - Math.floor(bombCount / 2);
        
            
            for (let i = 1; i <= adjustedNumPairs; i++) {
                pairs.push({ src: `img/img${i}.jpg`, pairId: i });
                pairs.push({ src: `img/img${i}.jpg`, pairId: i });
            }
        
            
            if (isHardMode) {
                for (let i = 0; i < bombCount; i++) {
                    pairs.push({ src: 'img/imjBOMB.jpg', pairId: 'BOMB' });
                }
            }
        
            return pairs.sort(() => Math.random() - 0.5);
        }
        

        function getHardModeMultiplier(gridSize) {
            switch (gridSize) {
                case 10: return 2;
                case 14: return 2.2;
                case 18: return 2.5;
                case 26: return 2.7;
                case 34: return 3;
                default: return 1;
            }
        }

        function getNormalModeMultiplier(gridSize) {
            switch (gridSize) {
                case 8: return 1;
                case 12: return 1.2;
                case 16: return 1.5;
                case 24: return 1.7;
                case 32: return 2;
                default: return 1;
            }
        }
        

        function getBombCount(gridSize) {
            if (gridSize <= 16) return 2; 
            if (gridSize <= 24) return 4; 
            return 6; 
        }

       
        $('#game-board').on('click', '.card', function () {
            if ($(this).hasClass('flipped') || flippedCards.length === 2) return;

            $(this).addClass('flipped');
            flippedCards.push($(this));

            if (flippedCards.length === 2) {
                const firstCard = flippedCards[0];
                const secondCard = flippedCards[1];

                if (firstCard.data('pair-id') === secondCard.data('pair-id')) {
                    if (firstCard.data('pair-id') === 'BOMB') {
                        score = Math.max(score - 5000, -9999); 
                        $('#score-display').html(`<span class="label">Score:</span> ${Math.round(score)}`);
                        setTimeout(showLossMessage, 500); 
                    } else {
                        matchedPairs++;
                        score += 100 * multiplier;
                        $('#score-display').html(`<span class="label">Score:</span> ${Math.round(score)}`);

                        firstCard.addClass('match');
                        secondCard.addClass('match');
                        flippedCards = [];

                        
                        const nonBombPairs = images.filter(img => img.pairId !== 'BOMB').length / 2;
                        if (matchedPairs === nonBombPairs) {
                            setTimeout(showVictoryMessage, 500);
                        }
                    }
                    flippedCards = [];
                } else {
                    setTimeout(() => {
                        firstCard.removeClass('flipped');
                        secondCard.removeClass('flipped');
                        flippedCards = [];
                    }, 2000);
                }
            }
        });

        function showVictoryMessage() {
            $('#victory-message').html('<p>You didnt get caught!</p>').addClass('active');
            $('body').addClass('blur');
            gameFinished = true; 
            updateUserScore(playerName, score); 
            updateLeaderboard(); 
        }

        function showLossMessage() {
            $('#victory-message').html('<p>You lost by hitting the bomb!</p>').addClass('active');
            $('body').addClass('blur');
            gameFinished = true; 
        }

        $('#restart-button').click(function () {
            $('body').removeClass('blur');
            location.reload();
        });
        
        $('#exit-button').click(function () {
            if (gameFinished) {
                
                updateUserScore(playerName, score);
            }
            window.location.href = 'index.html';
        });
    }
});
