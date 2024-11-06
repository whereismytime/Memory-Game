$(document).ready(function () {
    // Активная кнопка выбора режима
    $('.mode-btn').click(function () {
        $('.mode-btn').removeClass('active');
        $(this).addClass('active');
    });

    $('.grid-btn').click(function () {
        $('.grid-btn').removeClass('active');
        $(this).addClass('active');
    });

    $('#player-name').on('input', function () {
        const inputVal = $(this).val();
        const validVal = inputVal.replace(/[^a-zA-Zа-яА-Я0-9]/g, '');
        $(this).val(validVal);
    });

    $('#start-button').click(function () {
        const playerName = $('#player-name').val().trim();
        if (!playerName || playerName.length < 3) {
            alert("Введите имя (минимум 3 символа)");
            return;
        }

        const selectedMode = $('.mode-btn.active').text() || 'Обычный';
        const gridSize = $('.grid-btn.active').data('grid') || 8;

        window.location.href = `game.html?name=${encodeURIComponent(playerName)}&mode=${encodeURIComponent(selectedMode)}&gridSize=${gridSize}`;
    });
});

$(document).ready(function () {
    if (window.location.pathname.includes("game.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const playerName = urlParams.get('name');
        const gameMode = urlParams.get('mode');
        const gridSize = parseInt(urlParams.get('gridSize'));

        $('#player-name-display').html(playerName);
        $('#mode-display').html(gameMode);
        $('#grid-size-display').html(`${gridSize} карточек`);

        let images = generateImagePairs(gridSize / 2);
        let flippedCards = [];
        let matchedPairs = 0;
        let score = 0;
        let multiplier = 1 + (gridSize - 8) / 10;

        createCards();

        function createCards() {
            const gameBoard = $('#game-board');
            gameBoard.empty();
            images.forEach(image => {
                const card = $(`
                    <div class="card" data-pair-id="${image.pairId}">
                        <div class="front">?</div>
                        <div class="back" style="background-image: url('${image.src}')"></div>
                    </div>
                `);
                gameBoard.append(card);
            });
        }

        function generateImagePairs(numPairs) {
            let pairs = [];
            for (let i = 1; i <= numPairs; i++) {
                pairs.push({ src: `img/img${i}.jpg`, pairId: i });
                pairs.push({ src: `img/img${i}.jpg`, pairId: i });
            }
            return pairs.sort(() => Math.random() - 0.5);
        }

        $('#game-board').on('click', '.card', function () {
            if ($(this).hasClass('flipped') || flippedCards.length === 2) return;

            $(this).addClass('flipped');
            flippedCards.push($(this));

            if (flippedCards.length === 2) {
                const firstCard = flippedCards[0];
                const secondCard = flippedCards[1];

                if (firstCard.data('pair-id') === secondCard.data('pair-id')) {
                    matchedPairs++;
                    score += 100 * multiplier;
                    $('#score-display').html(`<span class="label">Очки:</span> ${Math.round(score)}`);

                    firstCard.addClass('match');
                    secondCard.addClass('match');
                    flippedCards = [];

                    if (matchedPairs === gridSize / 2) {
                        setTimeout(showVictoryMessage, 500);
                    }
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
            $('#victory-message').addClass('active');
            $('#game-board').addClass('blur');
            $('body').addClass('blur');
        }
    
        $('#restart-button').click(function () {
            // Логика для перезапуска игры
            location.reload(); // Обновляет страницу для перезапуска игры
        });
    
        $('#exit-button').click(function () {
            window.location.href = 'index.html';
        });
    }
});
