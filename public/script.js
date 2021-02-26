"use strict";
var heldDownKey = {
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
    12: false,
    20: false,
    21: false,
    22: false,
    24: false,
    25: false
};
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
var svgNameSpace = 'http://www.w3.org/2000/svg';
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
        keyPressInterpret(layoutMap[game.layout][pressEvent.key]);
        heldDownKey[layoutMap[game.layout][pressEvent.key]] = true;
    });
    document.addEventListener('keyup', function (pressEvent) {
        //console.log("keyboard released:", layoutMap[game.layout][pressEvent.key]);
        heldDownKey[layoutMap[game.layout][pressEvent.key]] = false;
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
    document.querySelectorAll('.label-bg').forEach(function (bg) {
        bg.classList.add('hidden');
        if (game.labelsVisible) {
            bg.classList.remove('hidden');
        }
    });
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
function generateKeyElement(info, id) {
    var svg = document.createElementNS(svgNameSpace, 'svg');
    svg.setAttribute('version', '1.1');
    svg.setAttribute('baseProfile', 'full');
    svg.setAttribute('viewBox', '0 0 62 302');
    svg.setAttribute('preserveAspectRatio', "none");
    //const defs = document.createElementNS(svgNameSpace, 'defs');
    //const blur = document.createElementNS(svgNameSpace, 'feGaussianBlur');
    //blur.setAttribute('in', 'SourceAlpha');
    //blur.setAttribute('stdDeviation', '4');
    //blur.setAttribute('result', 'blur');
    //defs.append(blur);
    var color = [info.hues[id], info.sat, info.light];
    var svgBg = drawRect(62, 302, color);
    svgBg.setAttribute('transform', "translate(" + 62 / 2 + "," + 302 / 2 + ")");
    var animateRect = svgBg.cloneNode();
    animateRect.classList.add('key-animate-layer');
    animateRect.setAttribute('fill', "hsl(" + color[0] + ", " + color[1] + "%, " + (color[2] + 35) + "%)");
    animateRect.setAttribute('opacity', '0');
    svg.append(svgBg, animateRect);
    var qwertyLabel = addText(getKeyByValue(layoutMap.qwerty, id), "qwerty");
    labelElements.qwerty.push(qwertyLabel);
    var dvorakLabel = addText(getKeyByValue(layoutMap.dvorak, id), "dvorak");
    labelElements.dvorak.push(dvorakLabel);
    var labelBg = drawRect(40, 60, [0, 0, 0]);
    labelBg.setAttribute('transform', 'translate(31, 259)');
    labelBg.setAttribute('rx', '13');
    labelBg.setAttribute('ry', '13');
    //labelBg.setAttribute('filter', 'blur');
    labelBg.classList.add('label-bg', 'hidden');
    svg.append(qwertyLabel, dvorakLabel, labelBg);
    svg.id = "key" + id;
    svg.classList.add("key");
    svg.color = color;
    svg.natural = info.natural;
    musicKeyElements[id] = svg;
    return svg;
}
function drawRect(width, height, inputColor) {
    var rect = document.createElementNS(svgNameSpace, 'rect');
    var color = "hsl(" + inputColor[0] + ", " + inputColor[1] + "%, " + inputColor[2] + "%)";
    rect.setAttribute('x', "-" + width / 2);
    rect.setAttribute('y', "-" + height / 2);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', color);
    return rect;
}
function addText(text, labelgroup) {
    var textElement = document.createElementNS(svgNameSpace, 'text');
    textElement.setAttribute('x', '21');
    textElement.setAttribute('y', '270');
    textElement.textContent = text;
    textElement.classList.add('label', 'hidden', labelgroup);
    return textElement;
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
        key.addEventListener("click", function () {
            //console.log("manual input: ", id);
            keyPressInterpret(id);
        });
        key.classList.add('black-key');
        $("blackRow").appendChild(key);
    });
    $('key-1').classList.add('hidden-key');
    var keyCopy1 = $('key-1').cloneNode();
    var keyCopy2 = $('key-1').cloneNode();
    $("blackRow").appendChild(keyCopy1);
    $("blackRow").appendChild(keyCopy2);
    whiteInfo.ids.forEach(function (id) {
        var key = generateKeyElement(whiteInfo, id);
        key.addEventListener("click", function () {
            //console.log("manual input: ", id);
            keyPressInterpret(id);
        });
        $("whiteRow").appendChild(key);
    });
}
function keyAnimate(key) {
    var keyAnimate = key.querySelector('.key-animate-layer');
    keyAnimate.classList.remove('key-animate');
    setTimeout(function () {
        keyAnimate.classList.add('key-animate');
    }, 23);
}
function keyPressInterpret(idInput) {
    if (heldDownKey[idInput]) {
        return;
    }
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
    $("scoreDisplay").textContent = String(game.score);
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
    $("scoreDisplay").textContent = null;
}
function newGame() {
    game.playerTurn = false;
    game.freePlay = false;
    $("container").className = "bg-computer-turn";
    console.log("start new game!!!");
    game.secretSequence = [];
    game.playerSequenceIndex = 0;
    game.score = 0;
    $("scoreDisplay").textContent = String(game.score);
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