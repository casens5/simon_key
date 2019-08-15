// to do
//
// refactor ... everything.  stop using confusing boolean gamestate variables as bandaids and unify the goddamn thing
//
// how to load files from separate folder
// current audio functions allow someone to mash audio until the page breaks.  need more advanced audio function
// full typescript migration/debugging
'use strict';
var audioDiv = document.querySelector('#audioDiv');
var blackRow = document.querySelector('#blackRow');
var whiteRow = document.querySelector('#whiteRow');
var qwertyLabels;
var dvorakLabels;
var containerDiv = document.querySelector('#container');
var keyInputBox = document.querySelector('#showKeyInput');
var newGameBtn = document.querySelector('#newGame');
var freePlayBtn = document.querySelector('#freePlay');
var scoreDiv = document.querySelector('#gameScore');
var keyboardSelector = document.querySelector('#keyboardLayout');
var replaySequenceBtn = document.querySelector('#replaySequence');
var keyCollection = [];
var gameSequence = [];
var playersTurn;
var playerSequenceIndex = -1;
var playerStarted = false;
var isTheGameOver = false;
var winChord = [0, 4, 7, 12];
var freeChord = [0, 11, 2, 9, 4, 7, 6, 5, 8, 3, 10, 1, 12];
var score = -1;
var dvorakInput = {
    name: 'dvorak',
    keys: {
        'a': 0,
        ',': 1,
        'o': 2,
        '.': 3,
        'e': 4,
        'u': 5,
        'g': 6,
        'h': 7,
        'c': 8,
        't': 9,
        'r': 10,
        'n': 11,
        's': 12,
        'w': 20,
        'v': 21,
        'm': 22
    }
};
var dvorakpermissiveTyping = {
    'i': 7,
    'y': 6,
    'd': 5
};
var qwertyInput = {
    name: 'qwerty',
    keys: {
        'a': 0,
        'w': 1,
        's': 2,
        'e': 3,
        'd': 4,
        'f': 5,
        'u': 6,
        'j': 7,
        'i': 8,
        'k': 9,
        'o': 10,
        'l': 11,
        ';': 12,
        ',': 20,
        '.': 21,
        'm': 23 // dvorak
    }
};
var keyboardLayout = qwertyInput;
newGameBtn.addEventListener('click', newGame);
freePlayBtn.addEventListener('click', freePlay);
keyboardSelector.addEventListener('change', function (event) {
    console.log("switch keyboard");
    var selector = event.target.value;
    if (selector === 'qwerty')
        keyboardLayout = qwertyInput;
    dvorakLabels.forEach(function (node) {
        node.classList.add('hidden');
    });
    if (selector === 'dvorak')
        keyboardLayout = dvorakInput;
    qwertyLabels.forEach(function (node) {
        node.classList.add('hidden');
    });
});
keyInputBox.addEventListener('change', function () {
    if (keyboardLayout.name === 'qwerty')
        qwertyLabels.classList.toggle('hidden');
    else
        dvorakLabels.classList.toggle('hidden');
});
replaySequenceBtn.addEventListener('click', replayComputerSequence);
function getKeyByValue(object, value) {
    return Object.keys(object).find(function (key) { return object[key] === value; });
}
function toggleLabelVisibility() {
}
function replayComputerSequence() {
    if (!isTheGameOver && !playerStarted && (gameSequence !== [])) {
        playersTurn = false;
        containerDiv.className = 'bg-computer-turn';
        playSequence(gameSequence.slice().reverse());
    }
}
function generateKeyboard() {
    var blacks = [1, 3, null, 6, 8, 10];
    var blackHues = [205, 257, null, 0, 52, 103];
    var blackSat = 55;
    var blackLight = 29;
    var whites = [0, 2, 4, 5, 7, 9, 11, 12];
    var whiteHues = [0, 51, 103, 154, 206, 257, 308, 0];
    var whiteSat = 27;
    var whiteLight = 59;
    //someday you can refactor this.  thanks, future me
    blacks.forEach(function (id) {
        var newDiv = document.createElement('div');
        var qwertyLabel = document.createElement('span');
        var dvorakLabel = document.createElement('span');
        qwertyLabel.classList.add('label', 'qwerty', 'hidden');
        dvorakLabel.classList.add('label', 'dvorak', 'hidden');
        qwertyLabel.textContent = getKeyByValue(qwertyInput, id);
        dvorakLabel.textContent = getKeyByValue(dvorakInput, id);
        newDiv.classList.add('key-' + id, 'key');
        newDiv.id = 'key' + id;
        blackRow.append(newDiv, qwertyLabel, dvorakLabel);
        newDiv.addEventListener('click', function () {
            console.log('manual input: ', id);
            hitKey(id, true);
        });
        newDiv.color = [blackHues.shift(), blackSat, blackLight];
        newDiv.natural = false;
        keyCollection[id] = newDiv;
    });
    whites.forEach(function (id) {
        var newDiv = document.createElement('div');
        newDiv.classList.add('key-' + id, 'key');
        newDiv.id = 'key' + id;
        whiteRow.appendChild(newDiv);
        newDiv.addEventListener('click', function () {
            console.log('manual input: ', id);
            hitKey(id, true);
        });
        newDiv.color = [whiteHues.shift(), whiteSat, whiteLight];
        newDiv.natural = true;
        keyCollection[id] = newDiv;
    });
    qwertyLabels = document.querySelectorAll('.qwerty');
    dvorakLabels = document.querySelectorAll('.dvorak');
}
function hitKey(keyIndex, player) {
    if (playersTurn == player) {
        var audioElement = document.createElement('audio');
        var source = document.createElement('source');
        keyAnimate(keyCollection[keyIndex]);
        audioElement.appendChild(source);
        audioDiv.appendChild(audioElement);
        source.src = "organ" + keyIndex + ".ogg";
        source.type = 'audio/ogg';
        audioElement.play();
        if (playersTurn && (gameSequence[0] != null)) {
            playerSequenceIndex++;
            checkMatchingNotes(keyIndex, playerSequenceIndex);
        }
        setTimeout(function () { audioElement.remove(); }, 1729);
    }
}
function keyAnimate(key) {
    var lightness = 14;
    var lightStep = 1;
    if (key.natural) {
        lightness = 28;
        lightStep = 2;
    }
    var id = setInterval(animateStep, 19);
    function animateStep() {
        if (lightness == 0) {
            key.style.background = 'hsl(' + key.color[0] + ', ' + key.color[1] + '%, ' + key.color[2] + '%)';
            clearInterval(id);
        }
        else {
            key.style.background = 'hsl(' + key.color[0] + ', ' + key.color[1] + '%, ' + (key.color[2] + lightness) + '%)';
            lightness -= lightStep;
        }
    }
}
function playSequence(sequence) {
    var sequenceCopy = sequence.slice();
    console.log(sequenceCopy);
    hitKey(sequenceCopy.pop(), false);
    if (sequenceCopy.length > 0) {
        setTimeout(playSequence, 843, sequenceCopy);
    }
    else {
        playerTurn();
    }
}
function playerTurn() {
    setTimeout(function () {
        containerDiv.className = 'bg-player-turn';
        playersTurn = true;
    }, 377);
    console.log("now's your turn");
    document.onkeypress = keyPressInterpret;
}
function keyPressInterpret(pressEvent) {
    console.log('keyboard input: ', keyboardLayout.keys[pressEvent.key]);
    if (keyboardLayout.keys[pressEvent.key] === 20)
        newGame();
    if (keyboardLayout.keys[pressEvent.key] === 21)
        freePlay();
    if (keyboardLayout.keys[pressEvent.key] === 23) {
        console.log("switch to dvorak");
        keyboardLayout = dvorakInput;
    }
    else if (keyboardLayout.keys[pressEvent.key] === 22) {
        console.log("switch to qwerty");
        keyboardLayout = qwertyInput;
    }
    hitKey(keyboardLayout.keys[pressEvent.key], true);
}
;
function freePlay() {
    isTheGameOver = false;
    containerDiv.className = 'bg-free-play';
    console.log('play however you like.  there is no rush');
    playChord(freeChord);
    gameSequence = [];
    playerSequenceIndex = -1;
    playersTurn = true;
    scoreDiv.textContent = null;
    document.onkeypress = keyPressInterpret;
}
function correctSequence() {
    containerDiv.className = 'bg-computer-turn';
    console.log('good job bud');
    playerStarted = false;
    setTimeout(playChord, 233, winChord);
    score++;
    scoreDiv.textContent = String(score);
    setTimeout(computerTurn, 2197);
}
function computerTurn() {
    console.log("now's the computer's turn");
    playersTurn = false;
    playerSequenceIndex = -1;
    gameSequence.push(Math.floor(Math.random() * 13));
    playSequence(gameSequence.slice().reverse());
}
function newGame() {
    playersTurn = false;
    containerDiv.className = 'bg-computer-turn';
    console.log('start new game!!!');
    isTheGameOver = false;
    playerStarted = false;
    gameSequence = [];
    playerSequenceIndex = -1;
    score = 0;
    scoreDiv.textContent = String(score);
    setTimeout(computerTurn, 987);
}
function checkMatchingNotes(keyIndex, playerSequenceIndex) {
    if (gameSequence[playerSequenceIndex] != keyIndex) {
        gameOver();
    }
    else if (playerSequenceIndex == (gameSequence.length - 1)) {
        playersTurn = false;
        setTimeout(correctSequence, 233);
    }
}
function gameOver() {
    playersTurn = false;
    isTheGameOver = true;
    playerStarted = false;
    containerDiv.className = 'bg-game-over';
    console.log('you lose');
    var root = Math.floor(Math.random() * 13);
    var chord = [root];
    chord.push((root + 1) % 13);
    chord.push((root + 6) % 13);
    chord.push((root + 7) % 13);
    chord.push(Math.floor(Math.random() * 13));
    playChord(chord);
}
function playChord(chord, step, speed) {
    if (step === void 0) {
        step = 0;
    }
    if (speed === void 0) {
        speed = 73;
    }
    hitKey(chord[step], false);
    step++;
    if (step < chord.length) {
        setTimeout(playChord, speed, chord, step++);
    }
}
generateKeyboard();
freePlay();
