// to do
//
// refactor ... everything.  stop using confusing boolean gamestate variables as bandaids and unify the goddamn thing
// full typescript migration/debugging
// no keyboard input during gameOver state, which means no newGame, freePlay, etc.
// holding down a key problem -- can it be fixed without deing onkeyup?
// better way of loading/playing sounds?

"use strict";
// DOM elements
var dom = {
  audioDiv: document.querySelector("#audioDiv"),
  blackRow: document.querySelector("#blackRow"),
  whiteRow: document.querySelector("#whiteRow"),
  containerDiv: document.querySelector("#container"),
  labelVisibilityCheckbox: document.querySelector("#showKeyInput"),
  newGameBtn: document.querySelector("#newGame"),
  freePlayBtn: document.querySelector("#freePlay"),
  scoreDiv: document.querySelector("#gameScore"),
  layoutSelector: document.querySelector("#layoutSelector"),
  replaySequenceBtn: document.querySelector("#replaySequenceBtn"),
  labelNodes: {},
  musicKey: []
};

var chords = {
  win: [0, 4, 7, 12],
  freePlay: [0, 11, 2, 9, 4, 7, 6, 5, 8, 3, 10, 1, 12]
};

var layout = {
  dvorak: {
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
  },
  // alternate key input that might be good UX but idk
  permissiveDvorak: {
    i: 7,
    y: 6,
    d: 5
  },
  qwerty: {
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

var game = {
  score: -1, //why -1?  surely we can do better
  secretSequence: [],
  labelsVisible: false,
  layout: layout.qwerty,

  //what the hell is this?  get this out of here.
  playersTurn: null,
  playerSequenceIndex: -1,
  playerStarted: false,
  isTheGameOver: false
};

dom.newGameBtn.addEventListener("click", newGame);
dom.freePlayBtn.addEventListener("click", freePlay);
dom.replaySequenceBtn.addEventListener("click", replayComputerSequence);
dom.layoutSelector.addEventListener("change", function(event) {
  changeLayout(event.target.value);
});

function changeLayout(newLayout) {
  console.log("switch keyboard to", newLayout);
  if (newLayout === "qwerty") game.layout = layout.qwerty;
  dom.labelNodes.dvorak.forEach(function(node) {
    node.classList.add("hidden");
  });
  if (newLayout === "dvorak") game.layout = layout.dvorak;
  dom.labelNodes.qwerty.forEach(function(node) {
    node.classList.add("hidden");
  });
}

dom.labelVisibilityCheckbox.addEventListener("change", function() {});

function toggleLabelVisibility() {}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

// create dom element for keyboard input => musical key
function generateLabel(labeltext: string, labelGroup: string) {
  var label = document.createElement("span");
  label.classList.add("label", labelGroup, "hidden");
  label.textContent = labeltext;
  return label;
}

function generateKeyElement(rowObject, id) {
  var newDiv = document.createElement("div");
  // grabs the keyboard input that triggers the given music key
  var qwertyLabel = generateLabel(getKeyByValue(layout.qwerty, id), "qwerty");
  var dvorakLabel = generateLabel(getKeyByValue(layout.dvorak, id), "dvorak");
  newDiv.classList.add("key-" + id, "key");
  newDiv.id = "key" + id;
  rowObject.append(newDiv, qwertyLabel, dvorakLabel);
  newDiv.addEventListener("click", function() {
    console.log("manual input: ", id);
    hitKey(id, true);
  });
  newDiv.color = [
    rowObject.info.hues[id],
    rowObject.info.sat,
    rowObject.info.light
  ];
  newDiv.natural = rowObject.info.natural;
  dom.musicKey[id] = newDiv;
}

function generateKeyboard() {
  dom.blackRow.info = {
    ids: [1, 3, null, 6, 8, 10],
    hues: {
      1: 205,
      3: 257,
      6: 0,
      8: 52,
      10: 103
    },
    sat: 55,
    light: 29,
    natural: false
  };
  dom.whiteRow.info = {
    ids: [0, 2, 4, 5, 7, 9, 11, 12],
    hues: {
      0: 0,
      2: 51,
      4: 103,
      5: 154,
      7: 206,
      9: 257,
      11: 308,
      12: 0
    },
    sat: 27,
    light: 59,
    natural: true
  };

  dom.blackRow.info.ids.forEach(function(id) {
    generateKeyElement(dom.blackRow, id);
  });

  dom.whiteRow.info.ids.forEach(function(id) {
    generateKeyElement(dom.whiteRow, id);
  });

  dom.labelNodes.qwerty = document.querySelectorAll(".qwerty");
  dom.labelNodes.dvorak = document.querySelectorAll(".dvorak");
}

function hitKey(keyId, player) {
  if (game.playersTurn == player) {
    var audioElement = document.createElement("audio");
    var source = document.createElement("source");
    keyAnimate(dom.musicKey[keyId]);
    audioElement.appendChild(source);
    dom.audioDiv.appendChild(audioElement);
    source.src = `./audio/organ${keyId}.ogg`;
    source.type = "audio/ogg";
    audioElement.play();
    if (game.playersTurn && game.secretSequence[0] != null) {
      game.playerSequenceIndex++;
      checkMatchingNotes(keyId);
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
  hitKey(sequenceCopy.shift(), false);
  if (sequenceCopy.length > 0) {
    setTimeout(playSequence, 843, sequenceCopy);
  } else {
    playerTurn();
  }
}

function replayComputerSequence() {
  if (
    !game.isTheGameOver &&
    !game.playerStarted &&
    game.secretSequence !== []
  ) {
    game.playersTurn = false;
    dom.containerDiv.className = "bg-computer-turn";
    playSequence(game.secretSequence);
  }
}

function keyPressInterpret(pressEvent) {
  console.log("keyboard input: ", game.layout[pressEvent.key]);
  if (game.layout[pressEvent.key] === 20) newGame();
  if (game.layout[pressEvent.key] === 21) freePlay();
  if (game.layout[pressEvent.key] === 23) {
    console.log("switch to dvorak");
    game.layout = layout.dvorak;
  } else if (game.layout[pressEvent.key] === 22) {
    console.log("switch to qwerty");
    game.layout = layout.qwerty;
  }
  hitKey(game.layout[pressEvent.key], true);
}

function correctSequence() {
  dom.containerDiv.className = "bg-computer-turn";
  console.log("good job bud");
  game.playerStarted = false;
  setTimeout(playChord, 233, chords.win);
  game.score++;
  dom.scoreDiv.textContent = String(game.score);
  setTimeout(computerTurn, 2197);
}

function checkMatchingNotes(keyId) {
  if (game.secretSequence[game.playerSequenceIndex] != keyId) {
    gameOver();
  } else if (game.playerSequenceIndex == game.secretSequence.length - 1) {
    game.playersTurn = false;
    setTimeout(correctSequence, 233);
  }
}

function freePlay() {
  game.isTheGameOver = false;
  dom.containerDiv.className = "bg-free-play";
  console.log("play however you like.  there is no rush");
  playChord(chords.freePlay);
  game.secretSequence = [];
  game.playerSequenceIndex = -1;
  game.playersTurn = true;
  game.score = null;
  dom.scoreDiv.textContent = null;
  document.onkeypress = keyPressInterpret;
}

function newGame() {
  game.playersTurn = false;
  dom.containerDiv.className = "bg-computer-turn";
  console.log("start new game!!!");
  game.isTheGameOver = false;
  game.playerStarted = false;
  game.secretSequence = [];
  game.playerSequenceIndex = -1;
  game.score = 0;
  dom.scoreDiv.textContent = String(game.score);
  setTimeout(computerTurn, 987);
}

function playerTurn() {
  setTimeout(function() {
    dom.containerDiv.className = "bg-player-turn";
    game.playersTurn = true;
  }, 377);
  console.log("now's your turn");
  document.onkeypress = keyPressInterpret;
}

function computerTurn() {
  console.log("now's the computer's turn");
  game.playersTurn = false;
  game.playerSequenceIndex = -1;
  game.secretSequence.push(Math.floor(Math.random() * 13));
  playSequence(game.secretSequence);
}

function gameOver() {
  game.playersTurn = false;
  game.isTheGameOver = true;
  game.playerStarted = false;
  dom.containerDiv.className = "bg-game-over";
  console.log("you lose");
  var root = Math.floor(Math.random() * 13);
  var badChord = [root];
  badChord.push((root + 6) % 13);
  badChord.push(Math.floor(Math.random() * 13));
  badChord.push((root + 1) % 13);
  badChord.push((root + 7) % 13);
  playChord(badChord);
}

// game init
generateKeyboard();
freePlay();
