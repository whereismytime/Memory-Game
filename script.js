$(document).ready(function () {
    let images = [
        { src: 'img/img1.jpg', pairId: 1 },
        { src: 'img/img2.jpg', pairId: 2 },
        { src: 'img/img3.jpg', pairId: 3 },
        { src: 'img/img4.jpg', pairId: 4 },
        { src: 'img/img1.jpg', pairId: 1 },
        { src: 'img/img2.jpg', pairId: 2 },
        { src: 'img/img3.jpg', pairId: 3 },
        { src: 'img/img4.jpg', pairId: 4 },
    ];

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

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

    let flippedCards = [];
    let matchedPairs = 0;

    $('#start-button').on('click', function () {
        shuffle(images);
        createCards();
        $(this).text('Finish');
    });

    $('#game-board').on('click', '.card', function () {
        if ($(this).hasClass('flipped') || flippedCards.length === 2) return;

        $(this).addClass('flipped');
        flippedCards.push($(this));

        if (flippedCards.length === 2) {
            const firstCard = flippedCards[0];
            const secondCard = flippedCards[1];

            if (firstCard.data('pair-id') === secondCard.data('pair-id')) {
                matchedPairs++;
                flippedCards = [];
                
                if (matchedPairs === images.length / 2) {
                    setTimeout(() => {
                        alert('Игра завершена!');
                        $('#start-button').text('Start');
                    }, 500); 
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
});
