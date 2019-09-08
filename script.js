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
    labelNodes: {
        qwerty: null,
        dvorak: null
    },
    labelsVisible: false,
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
        w: 20,
        v: 21,
        m: 22,
        b: 24,
        x: 25 // replaySequence
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
        ",": 20,
        ".": 21,
        m: 23,
        n: 24,
        b: 25 // replaySequence
    }
};
var game = {
    score: 0,
    secretSequence: [],
    labelsVisible: false,
    layout: layout.qwerty,
    layoutName: "qwerty",
    playerTurn: true,
    computerTempo: 784,
    playerSequenceIndex: 0,
    freePlay: true
};
dom.newGameBtn.addEventListener("click", newGame);
dom.freePlayBtn.addEventListener("click", freePlay);
dom.replaySequenceBtn.addEventListener("click", replayComputerSequence);
dom.layoutSelector.addEventListener("change", function (event) {
    changeLayout(event.target.value);
});
document.onkeypress = function (pressEvent) {
    console.log(pressEvent.key);
    console.log("keyboard input:", game.layout[pressEvent.key]);
    keyPressInterpret(game.layout[pressEvent.key]);
};
function changeLayout(newLayout) {
    console.log("switch keyboard to", newLayout);
    if (newLayout === "qwerty") {
        game.layout = layout.qwerty;
        game.layoutName = "qwerty";
        if (dom.labelsVisible) {
            dom.labelNodes.dvorak.forEach(function (node) {
                node.classList.add("hidden");
            });
            dom.labelNodes.qwerty.forEach(function (node) {
                node.classList.remove("hidden");
            });
        }
    }
    else {
        game.layout = layout.dvorak;
        game.layoutName = "dvorak";
        if (dom.labelsVisible) {
            dom.labelNodes.qwerty.forEach(function (node) {
                node.classList.add("hidden");
            });
            dom.labelNodes.dvorak.forEach(function (node) {
                node.classList.remove("hidden");
            });
        }
    }
}
dom.labelVisibilityCheckbox.addEventListener("change", toggleLabelVisibility);
function toggleLabelVisibility() {
    dom.labelsVisible = !dom.labelsVisible;
    if (dom.labelsVisible) {
        if (game.layoutName === "dvorak") {
            dom.labelNodes.dvorak.forEach(function (node) {
                node.classList.remove("hidden");
            });
        }
        else {
            dom.labelNodes.qwerty.forEach(function (node) {
                node.classList.remove("hidden");
            });
        }
    }
    else {
        dom.labelNodes.dvorak.forEach(function (node) {
            node.classList.add("hidden");
        });
        dom.labelNodes.qwerty.forEach(function (node) {
            node.classList.add("hidden");
        });
    }
}
function getKeyByValue(object, value) {
    return Object.keys(object).find(function (key) { return object[key] === value; });
}
// create dom element for keyboard input => musical key
function generateLabel(labeltext, labelGroup) {
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
    newDiv.append(qwertyLabel, dvorakLabel);
    newDiv.classList.add("key-" + id, "key");
    newDiv.id = "key" + id;
    rowObject.append(newDiv);
    newDiv.addEventListener("click", function () {
        console.log("manual input: ", id);
        keyPressInterpret(id);
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
    dom.blackRow.info.ids.forEach(function (id) {
        generateKeyElement(dom.blackRow, id);
    });
    dom.whiteRow.info.ids.forEach(function (id) {
        generateKeyElement(dom.whiteRow, id);
    });
    dom.labelNodes.qwerty = document.querySelectorAll(".qwerty");
    dom.labelNodes.dvorak = document.querySelectorAll(".dvorak");
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
            key.style.background =
                "hsl(" +
                    key.color[0] +
                    ", " +
                    key.color[1] +
                    "%, " +
                    key.color[2] +
                    "%)";
            clearInterval(id);
        }
        else {
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
function keyPressInterpret(idInput) {
    switch (idInput) {
        //keyboard inputs
        case 20:
            newGame();
            break;
        case 21:
            freePlay();
            break;
        case 22:
            dom.layoutSelector.value = "qwerty";
            changeLayout("qwerty");
            break;
        case 23:
            dom.layoutSelector.value = "dvorak";
            changeLayout("dvorak");
            break;
        case 24:
            dom.labelVisibilityCheckbox.checked = !dom.labelVisibilityCheckbox
                .checked;
            toggleLabelVisibility();
            break;
        case 25:
            replayComputerSequence();
            break;
        default:
            // music note inputs
            if (game.playerTurn) {
                hitKey(idInput, true);
                if (!game.freePlay) {
                    checkMatchingNotes(idInput);
                }
            }
    }
}
function hitKey(keyId, isFromPlayer) {
    if (game.playerTurn === isFromPlayer) {
        keyAnimate(dom.musicKey[keyId]);
        var audioElement = document.createElement("audio");
        var source = document.createElement("source");
        audioElement.appendChild(source);
        dom.audioDiv.appendChild(audioElement);
        source.src = "./audio/organ" + keyId + ".ogg";
        source.type = "audio/ogg";
        audioElement.play();
        setTimeout(function () {
            audioElement.remove();
        }, 1729);
    }
}
function checkMatchingNotes(keyId) {
    if (game.secretSequence[game.playerSequenceIndex] != keyId) {
        gameOver();
    }
    else if (game.playerSequenceIndex == game.secretSequence.length - 1) {
        game.playerTurn = false;
        setTimeout(correctSequence, 233);
    }
    else {
        game.playerSequenceIndex++;
    }
}
function playChord(chord, step, speed) {
    hitKey(chord[step], false);
    step++;
    if (step < chord.length) {
        setTimeout(playChord, speed, chord, step, speed);
    }
}
function computerPlaySequence(sequence) {
    var sequenceCopy = sequence.slice();
    console.log(sequenceCopy);
    hitKey(sequenceCopy.shift(), false);
    if (sequenceCopy.length > 0) {
        setTimeout(computerPlaySequence, game.computerTempo, sequenceCopy);
    }
    else {
        playerTurn();
    }
}
function replayComputerSequence() {
    if (game.playerSequenceIndex === 0 && game.secretSequence[0] !== undefined) {
        console.log(game.secretSequence);
        console.log(game.playerSequenceIndex);
        game.playerTurn = false;
        dom.containerDiv.className = "bg-computer-turn";
        computerPlaySequence(game.secretSequence);
    }
}
function correctSequence() {
    game.playerTurn = false;
    dom.containerDiv.className = "bg-computer-turn";
    console.log("good job bud");
    setTimeout(playChord, 233, chords.win, 0, 73);
    game.score++;
    dom.scoreDiv.textContent = String(game.score);
    setTimeout(computerTurn, 1849);
}
function freePlay() {
    dom.containerDiv.className = "bg-free-play";
    console.log("play however you like.  there is no rush");
    game.secretSequence = [];
    game.playerSequenceIndex = 0;
    game.playerTurn = true;
    game.freePlay = true;
    game.score = null;
    dom.scoreDiv.textContent = null;
}
function newGame() {
    game.playerTurn = false;
    game.freePlay = false;
    dom.containerDiv.className = "bg-computer-turn";
    console.log("start new game!!!");
    game.secretSequence = [];
    game.playerSequenceIndex = 0;
    game.score = 0;
    dom.scoreDiv.textContent = String(game.score);
    setTimeout(computerTurn, 987);
}
function playerTurn() {
    setTimeout(function () {
        dom.containerDiv.className = "bg-player-turn";
        game.playerTurn = true;
    }, 377);
    console.log("now's your turn");
}
function computerTurn() {
    console.log("now's the computer's turn");
    game.playerTurn = false;
    game.playerSequenceIndex = 0;
    // add new note to secretSequence
    game.secretSequence.push(Math.floor(Math.random() * 13));
    computerPlaySequence(game.secretSequence);
}
function gameOver() {
    game.playerTurn = false;
    dom.containerDiv.className = "bg-game-over";
    game.secretSequence = [];
    console.log("you lose");
    // play that bad chord
    var root = Math.floor(Math.random() * 13);
    var badChord = [root];
    badChord.push((root + 6) % 13);
    badChord.push(Math.floor(Math.random() * 13));
    badChord.push((root + 1) % 13);
    badChord.push((root + 7) % 13);
    playChord(badChord, 0, 73);
}
// game init
generateKeyboard();
freePlay();
