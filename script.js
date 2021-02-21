"use strict";
//const heldDownKey = {
//	0: false,
//	1: false,
//	2: false,
//	3: false,
//	4: false,
//	5: false,
//	6: false,
//	7: false,
//	8: false,
//	9: false,
//	10: false,
//	11: false,
//	12: false,
//};
var labelElements = {
    // fill after keyboard is generated
    qwerty: [],
    dvorak: []
};
var sounds = [];
var musicKeyElements = [];
var chords = {
    win: [0, 4, 7, 12]
};
var layoutMap = {
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
    layout: "qwerty",
    playerTurn: true,
    computerTempo: 784,
    playerSequenceIndex: 0,
    freePlay: true
};
function $(id) {
    return document.getElementById(id);
}
function getKeyByValue(object, value) {
    return Object.keys(object).find(function (key) { return object[key] === value; });
}
function addEventListeners() {
    $("labelVisibilityCheckbox").addEventListener("change", toggleLabelVisibility);
    $("newGameBtn").addEventListener("click", newGame);
    $("freePlayBtn").addEventListener("click", freePlay);
    $("replaySequenceBtn").addEventListener("click", replayComputerSequence);
    $("layoutSelector").addEventListener("change", function (event) {
        changeLayout(event.target.value);
    });
    document.addEventListener('keydown', function (pressEvent) {
        //console.log(pressEvent.key);
        //console.log("keyboard pressed:", layoutMap[game.layout][pressEvent.key]);
        //heldDownKey(layoutMap[game.layout][pressEvent.key]) = true
        keyPressInterpret(layoutMap[game.layout][pressEvent.key]);
    });
    document.addEventListener('keyup', function (pressEvent) {
        //console.log("keyboard released:", layoutMap[game.layout][pressEvent.key]);
        //heldDownKey(layoutMap[game.layout][pressEvent.key]) = false
    });
}
function changeLayout(newLayout) {
    console.log("switch keyboard to", newLayout);
    $("layoutSelector").value = newLayout;
    if (newLayout === "qwerty") {
        game.layout = "qwerty";
        if (game.labelsVisible) {
            showThisHideThat(labelElements.qwerty, labelElements.dvorak);
        }
    }
    else {
        game.layout = "dvorak";
        if (game.labelsVisible) {
            showThisHideThat(labelElements.dvorak, labelElements.qwerty);
        }
    }
}
function showThisHideThat(showThis, hideThat) {
    showThis.forEach(function (node) {
        node.classList.remove("hidden");
    });
    hideThat.forEach(function (node) {
        node.classList.add("hidden");
    });
}
function toggleLabelVisibility() {
    game.labelsVisible = !game.labelsVisible;
    $("labelVisibilityCheckbox").checked = game.labelsVisible;
    labelElements.dvorak.forEach(function (node) {
        node.classList.add("hidden");
    });
    labelElements.qwerty.forEach(function (node) {
        node.classList.add("hidden");
    });
    if (game.labelsVisible) {
        if (game.layout === "dvorak") {
            labelElements.dvorak.forEach(function (node) {
                node.classList.remove("hidden");
            });
        }
        else {
            labelElements.qwerty.forEach(function (node) {
                node.classList.remove("hidden");
            });
        }
    }
}
function generateLabel(labeltext, labelGroup) {
    // create DOM element for keyboard input => musical key
    var label = document.createElement("span");
    label.classList.add("label", labelGroup, "hidden");
    label.textContent = labeltext;
    return label;
}
function generateKeyElement(info, id) {
    var newDiv = document.createElement("div");
    var qwertyLabel = generateLabel(getKeyByValue(layoutMap.qwerty, id), "qwerty");
    labelElements.qwerty.push(qwertyLabel);
    var dvorakLabel = generateLabel(getKeyByValue(layoutMap.dvorak, id), "dvorak");
    labelElements.dvorak.push(dvorakLabel);
    newDiv.append(qwertyLabel, dvorakLabel);
    newDiv.classList.add("key-" + id, "key");
    newDiv.id = "key" + id;
    newDiv.addEventListener("click", function () {
        console.log("manual input: ", id);
        keyPressInterpret(id);
    });
    newDiv.color = [info.hues[id], info.sat, info.light];
    newDiv.natural = info.natural;
    musicKeyElements[id] = newDiv;
    return newDiv;
}
function generateKeyboard() {
    var blackInfo = {
        ids: [1, 3, -1, 6, 8, 10],
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
    var whiteInfo = {
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
    blackInfo.ids.forEach(function (id) {
        var key = generateKeyElement(blackInfo, id);
        $("blackRow").appendChild(key);
    });
    whiteInfo.ids.forEach(function (id) {
        var key = generateKeyElement(whiteInfo, id);
        $("whiteRow").appendChild(key);
    });
}
function keyAnimate(key) {
    var lightness = 20.4;
    var lightStep = 1.2;
    if (key.natural) {
        lightness = 40.8;
        lightStep = 2.4;
    }
    var id = setInterval(animateStep, 19);
    function animateStep() {
        if (lightness <= 0) {
            key.style = null;
            clearInterval(id);
        }
        else {
            key.style.background = "hsl(" + key.color[0] + ", " + key.color[1] + "%, " + (key.color[2] + lightness) + "%)";
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
            changeLayout("qwerty");
            break;
        case 23:
            changeLayout("dvorak");
            break;
        case 24:
            toggleLabelVisibility();
            break;
        case 25:
            if (game.playerTurn) {
                replayComputerSequence();
            }
            break;
        default:
            // music note inputs
            if (game.playerTurn) {
                hitKey(idInput);
                if (!game.freePlay) {
                    checkMatchingNotes(idInput);
                }
            }
    }
}
function generateSoundBank() {
    for (var i = 0; i < 13; i++) {
        var audioElement = new Howl({
            src: ["./audio/organ" + i + ".ogg"]
        });
        sounds.push(audioElement);
    }
}
function hitKey(keyId) {
    keyAnimate(musicKeyElements[keyId]);
    sounds[keyId].play();
}
function checkMatchingNotes(keyId) {
    if (game.secretSequence[game.playerSequenceIndex] !== keyId) {
        gameOver();
    }
    else if (game.playerSequenceIndex === game.secretSequence.length - 1) {
        game.playerTurn = false;
        setTimeout(correctSequence, 233);
    }
    else {
        game.playerSequenceIndex++;
    }
}
function playChord(chord, step, speed) {
    hitKey(chord[step]);
    step++;
    if (step < chord.length) {
        setTimeout(playChord, speed, chord, step, speed);
    }
}
function computerPlaySequence(sequence) {
    var sequenceCopy = sequence.slice();
    //console.log(sequenceCopy);
    hitKey(sequenceCopy.shift());
    if (sequenceCopy.length > 0) {
        setTimeout(computerPlaySequence, game.computerTempo, sequenceCopy);
    }
    else {
        playerTurn();
    }
}
function replayComputerSequence() {
    if (game.playerSequenceIndex !== 0 ||
        game.secretSequence[0] === undefined) {
        return;
    }
    //console.log(game.secretSequence);
    //console.log(game.playerSequenceIndex);
    game.playerTurn = false;
    $("container").className = "bg-computer-turn";
    computerPlaySequence(game.secretSequence);
}
function correctSequence() {
    game.playerTurn = false;
    $("container").className = "bg-computer-turn";
    //console.log("good job bud");
    setTimeout(playChord, 233, chords.win, 0, 73);
    game.score++;
    $("scoreDiv").textContent = String(game.score);
    setTimeout(computerTurn, 1849);
}
function freePlay() {
    $("container").className = "bg-free-play";
    console.log("play however you like.  there is no rush");
    game.secretSequence = [];
    game.playerSequenceIndex = 0;
    game.playerTurn = true;
    game.freePlay = true;
    game.score = null;
    $("scoreDiv").textContent = null;
}
function newGame() {
    game.playerTurn = false;
    game.freePlay = false;
    $("container").className = "bg-computer-turn";
    console.log("start new game!!!");
    game.secretSequence = [];
    game.playerSequenceIndex = 0;
    game.score = 0;
    $("scoreDiv").textContent = String(game.score);
    setTimeout(computerTurn, 987);
}
function playerTurn() {
    setTimeout(function () {
        $("container").className = "bg-player-turn";
        game.playerTurn = true;
    }, 377);
    //console.log("now's your turn");
}
function computerTurn() {
    //console.log("now's the computer's turn");
    game.playerTurn = false;
    game.playerSequenceIndex = 0;
    // add new note to secretSequence
    game.secretSequence.push(Math.floor(Math.random() * 13));
    computerPlaySequence(game.secretSequence);
}
function gameOver() {
    game.playerTurn = false;
    $("container").className = "bg-game-over";
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
function main() {
    addEventListeners();
    generateKeyboard();
    generateSoundBank();
    freePlay();
}
main();
