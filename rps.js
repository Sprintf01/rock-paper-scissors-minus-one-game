
            let score = JSON.parse(localStorage.getItem('score')) || {
                wins: 0,
                losses: 0,
                ties: 0
            };
            let result = '';
            let movesobj = { hand1: '', hand2: '' };
            let computerMove1 = pickComputerMove();
            let computerMove2 = pickComputerMove();
            let playerMove = '';
            
            updateScoreElement();
            
            function selectMove(hand, move) {
                movesobj[hand] = move;
                console.log(movesobj);
            }
            
            function showChoices() {
                if (movesobj.hand1 === '' || movesobj.hand2 === '') {
                alert('You have not selected your moves');
                return;
                }
            
                // Hide hand1, hand2, and the blurred image
                document.getElementById('hand1').style.display = 'none';
                document.getElementById('hand2').style.display = 'none';
                document.getElementById('show-hands-button').style.display = 'none';
                document.getElementById('blurred-image').style.display = 'none';
            
                // Show selected moves
                document.querySelector('.ur-moves').innerHTML = `
                <div class="aftershow" style="margin-left:170px;">You Chose:
                    <button class="choices" onclick="playGame('${movesobj.hand1}')">
                    <img src="${movesobj.hand1}-emoji.png" class="move-icon">
                    </button>
                    <button class="choices" onclick="playGame('${movesobj.hand2}')">
                    <img src="${movesobj.hand2}-emoji.png" class="move-icon">
                    </button>
                    <br>
                    (now choose which hand to keep)
                </div>
                `;
            
                document.querySelector('.timer').innerHTML = `
                <div class="aftershow">(You have 4.56 seconds to choose)</div>
                `;
            
                document.querySelector('.c-moves').innerHTML = `
                <div class="aftershow" style="margin-left:70px; margin-top:50px;">Computer Chose:
                    <img src="${computerMove1}-emoji.png" class="move-icon">
                    <img src="${computerMove2}-emoji.png" class="move-icon">
                </div>
                `;
            
                // Start timer
                setTimeout(timerfxn, 4560);
            }
            
            function playGame(selectedMove) {
                playerMove = selectedMove;
                const computerMove = compSecondMove(computerMove1, computerMove2);
            
                if (playerMove === 'scissors') {
                if (computerMove === 'rock') result = 'You lose.';
                else if (computerMove === 'paper') result = 'You win.';
                else if (computerMove === 'scissors') result = 'Tie.';
                } else if (playerMove === 'paper') {
                if (computerMove === 'rock') result = 'You win.';
                else if (computerMove === 'paper') result = 'Tie.';
                else if (computerMove === 'scissors') result = 'You lose.';
                } else if (playerMove === 'rock') {
                if (computerMove === 'rock') result = 'Tie.';
                else if (computerMove === 'paper') result = 'You lose.';
                else if (computerMove === 'scissors') result = 'You win.';
                }
            
                if (result === 'You win.') score.wins += 1;
                else if (result === 'You lose.') score.losses += 1;
                else if (result === 'Tie.') score.ties += 1;
            
                localStorage.setItem('score', JSON.stringify(score));
                updateScoreElement();
            
                document.querySelector('.js-result').innerHTML = result;
                document.querySelector('.ur-moves').innerHTML = `
                <img style="margin-left: 150px;" src="${playerMove}-emoji.png" class="move-icon">
                `;
                document.querySelector('.c-moves').innerHTML = `
                <img src="${computerMove}-emoji.png" class="move-icon" style="margin-left:60px; margin-top:45px;">
                `;
            
                // Reset the game after showing the result
                setTimeout(resetGame, 3000);
            }
            
            function resetGame() {
                // Reset moves
                movesobj = { hand1: '', hand2: '' };
                playerMove = '';
                computerMove1 = pickComputerMove();
                computerMove2 = pickComputerMove();
            
                // Show hand1, hand2, and the blurred image again
                document.getElementById('hand1').style.display = 'block';
                document.getElementById('hand2').style.display = 'block';
                document.getElementById('show-hands-button').style.display = 'block';
                document.getElementById('blurred-image').style.display = 'block';
            
                // Clear result and moves
                document.querySelector('.ur-moves').innerHTML = '';
                document.querySelector('.c-moves').innerHTML = '';
                document.querySelector('.js-result').innerHTML = '';
                document.querySelector('.timer').innerHTML = '';
            }
            
            function compSecondMove(move1, move2) {
                const randomNumber2 = Math.random();
                return randomNumber2 < 0.5 ? move1 : move2;
            }
            
            function updateScoreElement() {
                document.querySelector('.js-score').innerHTML = `Wins: ${score.wins}, Losses: ${score.losses}, Ties: ${score.ties}`;
            }
            
            function pickComputerMove() {
                const randomNumber = Math.random();
                if (randomNumber < 1 / 3) return 'rock';
                else if (randomNumber < 2 / 3) return 'paper';
                else return 'scissors';
            }
            
            function timerfxn() {
                if (playerMove === '') {
                alert('You took too long to choose :( Computer gets a point');
                score.losses += 1;
                localStorage.setItem('score', JSON.stringify(score));
                updateScoreElement();
                document.querySelector('.js-result').innerHTML = 'You lose.';
                resetGame();
                }
            }
            
            function resetScore() {
                score = { wins: 0, losses: 0, ties: 0 };
                localStorage.removeItem('score');
                updateScoreElement();
            }