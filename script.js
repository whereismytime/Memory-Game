// Функции для работы с localStorage
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

// Инициализация данных для ботов
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
    const selectedMode = { mode: 'Обычный', gridSize: 8 };

    // Обновление состояния кнопок
    function updateModeSelection() {
        $('.mode-btn').removeClass('active');
        $(`#${selectedMode.mode.toLowerCase()}-mode`).addClass('active');
        updateGridSelectionOptions();
    }

    function updateGridSelectionOptions() {
        $('.grid-btn').each(function () {
            let baseGridSize = parseInt($(this).data('base-grid'), 10);
            let adjustedGridSize = selectedMode.mode === 'Хард' ? baseGridSize + 2 : baseGridSize;
            $(this).text(`${adjustedGridSize} карточек`).data('grid', adjustedGridSize);
        });
    }

    function updateGridSelection() {
        $('.grid-btn').removeClass('active');
        $(`.grid-btn[data-grid="${selectedMode.gridSize}"]`).addClass('active');
    }

    if (currentUser) {
        $('#player-name').hide();
        $('#start-button').text('Начать игру').show();
        $('#player-welcome').text(`Добро пожаловать, ${currentUser}!`).show();
        updateLeaderboard();
    } else {
        $('#player-welcome').hide();
        $('#start-button').text('Играть').show();
    }

    // Обработчики для выбора режима
    $('.mode-btn').click(function () {
        selectedMode.mode = $(this).text();
        updateModeSelection();
        updateGridSelectionOptions();
    });

    // Обработчики для выбора сетки
    $('.grid-btn').click(function () {
        selectedMode.gridSize = $(this).data('grid');
        updateGridSelection();
    });

    $('#start-button').click(function () {
        let playerName = $('#player-name').val().trim();

        if (!currentUser) {
            if (!playerName || playerName.length < 3) {
                alert("Введите имя (минимум 3 символа)");
                return;
            }
            setCurrentUser(playerName);
            updateUserScore(playerName, 0);
            $('#player-welcome').text(`Добро пожаловать, ${playerName}!`).show();
            $('#player-name').hide();
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
        const gameMode = urlParams.get('mode') || "Обычный";
        const gridSize = parseInt(urlParams.get('gridSize')) || 8;
        const isHardMode = gameMode === "Хард";

        $('#player-name-display').html(playerName);
        $('#mode-display').html(gameMode);
        $('#grid-size-display').html(`${gridSize} карточек`);

        let images = generateImagePairs(gridSize / 2, isHardMode);
        let flippedCards = [];
        let matchedPairs = 0;
        let score = 0;
        let multiplier = isHardMode ? getHardModeMultiplier(gridSize) : 1;

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
        
            // Если режим "Хард", уменьшаем количество пар, чтобы освободить место для бомб
            const bombCount = isHardMode ? getBombCount(numPairs * 2) : 0;
            const adjustedNumPairs = numPairs - Math.floor(bombCount / 2);
        
            // Генерируем пары изображений
            for (let i = 1; i <= adjustedNumPairs; i++) {
                pairs.push({ src: `img/img${i}.jpg`, pairId: i });
                pairs.push({ src: `img/img${i}.jpg`, pairId: i });
            }
        
            // Добавляем бомбы, если включен режим "Хард"
            if (isHardMode) {
                for (let i = 0; i < bombCount; i++) {
                    pairs.push({ src: 'img/imjBOMB.jpg', pairId: 'BOMB' });
                }
            }
        
            return pairs.sort(() => Math.random() - 0.5);
        }
        

        function getHardModeMultiplier(gridSize) {
            switch (gridSize) {
                case 8:
                case 12: return 2.1;
                case 16: return 2.3;
                case 24: return 2.5;
                case 32: return 3;
                default: return 1;
            }
        }

        function getBombCount(gridSize) {
            if (gridSize <= 16) return 2; // Одна пара бомб
            if (gridSize <= 24) return 4; // Две пары бомб
            return 6; // Три пары бомб для больших сеток
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
                        score = Math.max(score - 5000, -9999); // Отнимаем 5000 очков, ограничиваем минимумом -9999
                        $('#score-display').html(`<span class="label">Очки:</span> ${Math.round(score)}`);
                        setTimeout(showLossMessage, 500); // Показываем сообщение о проигрыше
                    } else {
                        matchedPairs++;
                        score += 100 * multiplier;
                        $('#score-display').html(`<span class="label">Очки:</span> ${Math.round(score)}`);
        
                        firstCard.addClass('match');
                        secondCard.addClass('match');
                        flippedCards = [];
        
                        if (matchedPairs === Math.floor(gridSize / 2)) {
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
            $('#victory-message').html('<p>Вы не попались!</p>').addClass('active');
            $('body').addClass('blur');
            updateUserScore(playerName, score); // Сохраняем обновленный счет в таблицу лидеров
            updateLeaderboard(); // Обновляем таблицу лидеров в реальном времени
        }

        function showLossMessage() {
            $('#victory-message').html('<p>Вы проиграли, попав на бомбу!</p>').addClass('active');
            $('body').addClass('blur');
            updateUserScore(playerName, score); // Сохраняем счет в таблицу лидеров при проигрыше
            updateLeaderboard();
        }

        $('#restart-button').click(function () {
            $('body').removeClass('blur');
            location.reload();
        });
        
        $('#exit-button').click(function () {
            window.location.href = 'index.html';
        });
    }
});
