document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const cells = document.querySelectorAll('.cell');
    const statusElement = document.getElementById('status');
    const playerInfoElement = document.getElementById('player-info');
    const winnerPopup = document.getElementById('winner-popup');
    const winnerMessage = document.getElementById('winner-message');

    let playerNumber;
    let myTurn = false;
    let gameOver = false;

    // Display player info and symbol
    socket.on('playerAssigned', (number) => {
        playerNumber = number;
        if (playerInfoElement) {
            playerInfoElement.textContent = `You are Player ${playerNumber} (${playerNumber === 1 ? 'X' : 'O'})`;
        }
        statusElement.textContent = 'Waiting for another player...';
    });

    socket.on('startGame', (startingPlayer) => {
        statusElement.textContent = `Game started! Player ${startingPlayer}'s turn.`;
        myTurn = playerNumber === startingPlayer;
    });

    // Update the board
    socket.on('updateBoard', (board) => {
        board.forEach((mark, index) => {
            if (mark) {
                cells[index].textContent = mark;
                cells[index].classList.add('taken');
            }
        });
    });

    // Handle next turn
    socket.on('nextTurn', (currentPlayer) => {
        if (!gameOver) {
            myTurn = playerNumber === currentPlayer;
            statusElement.textContent = `Player ${currentPlayer}'s turn.`;
        }
    });

    // Show the winner or draw message
    socket.on('gameOver', (message) => {
        winnerMessage.textContent = message;
        winnerPopup.classList.remove('hidden');
        winnerPopup.classList.add('visible');
        cells.forEach((cell) => cell.classList.add('taken')); // Freeze the board
        gameOver = true; // Mark the game as over
        statusElement.textContent = message;
    });

    // Handle player disconnect
    socket.on('playerDisconnected', () => {
        statusElement.textContent = 'A player disconnected. Game reset.';
        resetBoard();
    });

    // Handle game full
    socket.on('gameFull', () => {
        statusElement.textContent = 'Game is full. Please try again later.';
    });

    // Click events for cells
    cells.forEach((cell) => {
        cell.addEventListener('click', () => {
            if (myTurn && !cell.classList.contains('taken') && !gameOver) {
                const index = cell.getAttribute('data-index');
                socket.emit('makeMove', { index: parseInt(index) });
            }
        });
    });

    // Reset the board
    function resetBoard() {
        cells.forEach((cell) => {
            cell.textContent = '';
            cell.classList.remove('taken');
        });
        winnerPopup.classList.add('hidden');
        statusElement.textContent = 'Waiting for players...';
        gameOver = false; // Reset gameOver status for a new game
    }

    // Get the restart button
    const restartButton = document.getElementById('restart-button');

    // Function to reset the game state
    function resetGame() {
        // Reset the game board (clear cells)
        cells.forEach(cell => {
            cell.textContent = ''; // Clear each cell's text
            cell.classList.remove('taken'); // Remove the taken class
        });

        // Reset player turns, status, and other relevant info
        currentPlayer = 'X'; // Set the starting player
        gameOver = false; // Set game state to ongoing
        statusElement.textContent = "Player X's turn"; // Reset status message

        // Hide the winner popup (if it is visible)
        winnerPopup.classList.remove('visible');  // Hide the popup
        winnerPopup.classList.add('hidden');      // Add hidden class to hide it

        // Reset player info if necessary
        playerXBox.classList.remove('active');
        playerOBox.classList.add('active');

        // You might want to reset socket events here if using multiplayer (optional)
        socket.emit('resetGame'); // Inform server to reset the game as well (if multiplayer)
    }

    // Attach event listener to restart button
    restartButton.addEventListener('click', resetGame);



});
