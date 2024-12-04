const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];
let board = Array(9).fill(null);
let currentPlayer = 1; // Player 1 starts the game

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A player connected');
    
    // Assign player number
    if (players.length < 2) {
        players.push(socket.id);
        const playerNumber = players.length; // 1 or 2
        socket.emit('playerAssigned', playerNumber);

        // If both players are connected, start the game
        if (players.length === 2) {
            io.emit('startGame', currentPlayer);
        }
    } else {
        socket.emit('gameFull');
    }

    // Listen for a move
    socket.on('makeMove', (data) => {
        if (board[data.index] === null && socket.id === players[currentPlayer - 1]) {
            board[data.index] = currentPlayer === 1 ? 'X' : 'O';
            io.emit('updateBoard', board);

            // Check if the game is over
            if (checkWinner()) {
                io.emit('gameOver', `Player ${currentPlayer} wins!`);
                resetGame();
            } else if (board.every(cell => cell !== null)) {
                io.emit('gameOver', 'It\'s a draw!');
                resetGame();
            } else {
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                io.emit('nextTurn', currentPlayer);
            }
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A player disconnected');
        players = players.filter(player => player !== socket.id);
        io.emit('playerDisconnected');
        resetGame();
    });

    // Reset the game
    function resetGame() {
        board = Array(9).fill(null);
        currentPlayer = 1;
    }

    socket.on('resetGame', () => {
        // Reset the game state on the server (board, turns, etc.)
        io.emit('gameReset');
    });


    // Check if there's a winner
    function checkWinner() {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        for (let combo of winningCombinations) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return true;
            }
        }
        return false;
    }
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
