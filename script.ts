// to do
//
// refactor ... everything.  stop using confusing boolean gamestate variables as bandaids and unify the goddamn thing
//
// how to load files from separate folder
// current audio functions allow someone to mash audio until the page breaks.  need more advanced audio function
// full typescript migration/debugging

"use strict";
// DOM elements
var audioDiv = document.querySelector("#audioDiv");
var blackRow = document.querySelector("#blackRow");
var whiteRow = document.querySelector("#whiteRow");
var labelNodes = {};
var containerDiv = document.querySelector("#container");
var labelVisibilityCheckbox = document.querySelector("#showKeyInput");
var newGameBtn = document.querySelector("#newGame");
var freePlayBtn = document.querySelector("#freePlay");
var scoreDiv = document.querySelector("#gameScore");
var layoutSelector = document.querySelector("#layoutSelector");
var replaySequenceBtn = document.querySelector("#replaySequenceBtn");

var keyCollection = [];
var gameSequence = [];
var playersTurn;
var playerSequenceIndex = -1;
var playerStarted = false;
var isTheGameOver = false;
var winChord = [0, 4, 7, 12];
var freeChord = [0, 11, 2, 9, 4, 7, 6, 5, 8, 3, 10, 1, 12];
var score = -1;
var labelsVisible = false;

var dvorakMap = {
  name: "dvorak",
  keys: {
    a: 0,
    ",": 1,
    o: 2,
    ".": 3,
    e: 4,
    u: 5,
    g: 6,
    h: 7,
    c: 8,
    t: 9,
    r: 10,
    n: 11,
    s: 12,
    w: 20, // newGame
    v: 21, // freePlay
    m: 22 // qwerty
  }
};

// alternate key input that might be helpful, or maybe not?
var dvorakpermissiveTyping = {
  i: 7,
  y: 6,
  d: 5
};

var qwertyMap = {
  name: "qwerty",
  keys: {
    a: 0,
    w: 1,
    s: 2,
    e: 3,
    d: 4,
    f: 5,
    u: 6,
    j: 7,
    i: 8,
    k: 9,
    o: 10,
    l: 11,
    ";": 12,
    ",": 20, // newGame
    ".": 21, // freePlay
    m: 23 // dvorak
  }
};

var keyboardLayout = qwertyMap;
newGameBtn.addEventListener("click", newGame);
freePlayBtn.addEventListener("click", freePlay);
layoutSelector.addEventListener("change", function(event) {
  changeLayout(event.target.value);
});

function changeLayout(newLayout) {
  console.log("switch keyboard to", newLayout);
  if (newLayout === "qwerty") keyboardLayout = qwertyMap;
  labelNodes.dvorak.forEach(function(node) {
    node.classList.add("hidden");
  });
  if (newLayout === "dvorak") keyboardLayout = dvorakMap;
  labelNodes.qwerty.forEach(function(node) {
    node.classList.add("hidden");
  });
}

labelVisibilityCheckbox.addEventListener("change", function() {});

replaySequenceBtn.addEventListener("click", replayComputerSequence);

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function toggleLabelVisibility() {}

function generateLabel(labeltext: string, labelGroup: string) {
  var label = document.createElement("span");
  label.classList.add("label", labelGroup, "hidden");
  label.textContent = labeltext;
  return label;
}

function generateKeyElement(rowObject, id) {
  var newDiv = document.createElement("div");
  var qwertyLabel = generateLabel(
    getKeyByValue(qwertyMap["keys"], id),
    "qwerty"
  );
  var dvorakLabel = generateLabel(
    getKeyByValue(dvorakMap["keys"], id),
    "dvorak"
  );
  newDiv.classList.add("key-" + id, "key");
  newDiv.id = "key" + id;
  rowObject.append(newDiv, qwertyLabel, dvorakLabel);
  newDiv.addEventListener("click", function() {
    console.log("manual input: ", id);
    hitKey(id, true);
  });
  newDiv.color = [
    rowObject.info.hues.shift(),
    rowObject.info.sat,
    rowObject.info.light
  ];
  newDiv.natural = rowObject.info.natural;
  keyCollection[id] = newDiv;
}

function generateKeyboard() {
  blackRow.info = {
    ids: [1, 3, null, 6, 8, 10],
    hues: [205, 257, null, 0, 52, 103],
    sat: 55,
    light: 29,
    natural: false
  };
  whiteRow.info = {
    ids: [0, 2, 4, 5, 7, 9, 11, 12],
    hues: [0, 51, 103, 154, 206, 257, 308, 0],
    sat: 27,
    light: 59,
    natural: true
  };

  blackRow.info.ids.forEach(function(id) {
    generateKeyElement(blackRow, id);
  });

  whiteRow.info.ids.forEach(function(id) {
    generateKeyElement(whiteRow, id);
  });

  labelNodes.qwerty = document.querySelectorAll(".qwerty");
  labelNodes.dvorak = document.querySelectorAll(".dvorak");
}

function hitKey(keyIndex, player) {
  if (playersTurn == player) {
    var audioElement = document.createElement("audio");
    var source = document.createElement("source");
    keyAnimate(keyCollection[keyIndex]);
    audioElement.appendChild(source);
    audioDiv.appendChild(audioElement);
    source.src = `./audio/organ${keyIndex}.ogg`;
    source.type = "audio/ogg";
    audioElement.play();
    if (playersTurn && gameSequence[0] != null) {
      playerSequenceIndex++;
      checkMatchingNotes(keyIndex, playerSequenceIndex);
    }
    setTimeout(() => {
      audioElement.remove();
    }, 1729);
  }
}

function keyAnimate(key) {
  var lightness = 14;
  var lightStep = 1;
  // despite what typescript claims, key.natural does exist
  if (key.natural) {
    lightness = 28;
    lightStep = 2;
  }
  var id = setInterval(animateStep, 19);
  function animateStep() {
    if (lightness == 0) {
      key.style.background =
        "hsl(" +
        key.color[0] +
        ", " +
        key.color[1] +
        "%, " +
        key.color[2] +
        "%)";
      clearInterval(id);
    } else {
      key.style.background =
        "hsl(" +
        key.color[0] +
        ", " +
        key.color[1] +
        "%, " +
        (key.color[2] + lightness) +
        "%)";
      lightness -= lightStep;
    }
  }
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

function playSequence(sequence) {
  var sequenceCopy = sequence.slice();
  console.log(sequenceCopy);
  hitKey(sequenceCopy.pop(), false);
  if (sequenceCopy.length > 0) {
    setTimeout(playSequence, 843, sequenceCopy);
  } else {
    playerTurn();
  }
}

function replayComputerSequence() {
  if (!isTheGameOver && !playerStarted && gameSequence !== []) {
    playersTurn = false;
    containerDiv.className = "bg-computer-turn";
    playSequence(gameSequence.slice().reverse());
  }
}

function keyPressInterpret(pressEvent) {
  console.log("keyboard input: ", keyboardLayout.keys[pressEvent.key]);
  if (keyboardLayout.keys[pressEvent.key] === 20) newGame();
  if (keyboardLayout.keys[pressEvent.key] === 21) freePlay();
  if (keyboardLayout.keys[pressEvent.key] === 23) {
    console.log("switch to dvorak");
    keyboardLayout = dvorakMap;
  } else if (keyboardLayout.keys[pressEvent.key] === 22) {
    console.log("switch to qwerty");
    keyboardLayout = qwertyMap;
  }
  hitKey(keyboardLayout.keys[pressEvent.key], true);
}

function correctSequence() {
  containerDiv.className = "bg-computer-turn";
  console.log("good job bud");
  playerStarted = false;
  setTimeout(playChord, 233, winChord);
  score++;
  scoreDiv.textContent = String(score);
  setTimeout(computerTurn, 2197);
}

function checkMatchingNotes(keyIndex: number, playerSequenceIndex: number) {
  if (gameSequence[playerSequenceIndex] != keyIndex) {
    gameOver();
  } else if (playerSequenceIndex == gameSequence.length - 1) {
    playersTurn = false;
    setTimeout(correctSequence, 233);
  }
}

function freePlay() {
  isTheGameOver = false;
  containerDiv.className = "bg-free-play";
  console.log("play however you like.  there is no rush");
  playChord(freeChord);
  gameSequence = [];
  playerSequenceIndex = -1;
  playersTurn = true;
  scoreDiv.textContent = null;
  document.onkeypress = keyPressInterpret;
}

function newGame() {
  playersTurn = false;
  containerDiv.className = "bg-computer-turn";
  console.log("start new game!!!");
  isTheGameOver = false;
  playerStarted = false;
  gameSequence = [];
  playerSequenceIndex = -1;
  score = 0;
  scoreDiv.textContent = String(score);
  setTimeout(computerTurn, 987);
}

function playerTurn() {
  setTimeout(function() {
    containerDiv.className = "bg-player-turn";
    playersTurn = true;
  }, 377);
  console.log("now's your turn");
  document.onkeypress = keyPressInterpret;
}

function computerTurn() {
  console.log("now's the computer's turn");
  playersTurn = false;
  playerSequenceIndex = -1;
  gameSequence.push(Math.floor(Math.random() * 13));
  playSequence(gameSequence.slice().reverse());
}

function gameOver() {
  playersTurn = false;
  isTheGameOver = true;
  playerStarted = false;
  containerDiv.className = "bg-game-over";
  console.log("you lose");
  var root = Math.floor(Math.random() * 13);
  var chord = [root];
  chord.push((root + 1) % 13);
  chord.push((root + 6) % 13);
  chord.push((root + 7) % 13);
  chord.push(Math.floor(Math.random() * 13));
  playChord(chord);
}

generateKeyboard();
freePlay();
