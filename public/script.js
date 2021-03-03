"use strict";
const heldDownKey = {
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
const labelElements = {
    // fill after keyboard is generated
    qwerty: [],
    dvorak: []
};
const sounds = [];
const musicKeyElements = [];
const chords = {
    win: [0, 4, 7, 12],
};
const layoutMap = {
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
        ";": 20,
        q: 21,
        m: 22,
        w: 24,
        j: 25 // replaySequence
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
        z: 20,
        x: 21,
        m: 23,
        ",": 24,
        c: 25 // replaySequence
    }
};
const game = {
    score: 0,
    secretSequence: [],
    labelsVisible: false,
    layout: "qwerty",
    playerTurn: true,
    computerTempo: 784,
    playerSequenceIndex: 0,
    freePlay: true,
    clock: setTimeout(() => { }, 0)
};
const svgNameSpace = 'http://www.w3.org/2000/svg';
function $(id) {
    return document.getElementById(id);
}
function nop() { }
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}
function clearClock() {
    game.clock = setTimeout(() => { }, 0);
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
    document.querySelectorAll('.label-bg').forEach(bg => {
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
    const svg = document.createElementNS(svgNameSpace, 'svg');
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
    const color = [info.hues[id], info.sat, info.light];
    const svgBg = drawRect(62, 302, color);
    svgBg.setAttribute('transform', `translate(${62 / 2},${302 / 2})`);
    const animateRect = svgBg.cloneNode();
    animateRect.classList.add('key-animate-layer');
    animateRect.setAttribute('fill', `hsl(${color[0]}, ${color[1]}%, ${color[2] + 35}%)`);
    animateRect.setAttribute('opacity', '0');
    svg.append(svgBg, animateRect);
    const qwertyLabel = addText(getKeyByValue(layoutMap.qwerty, id), "qwerty");
    labelElements.qwerty.push(qwertyLabel);
    const dvorakLabel = addText(getKeyByValue(layoutMap.dvorak, id), "dvorak");
    labelElements.dvorak.push(dvorakLabel);
    const labelBg = drawRect(40, 60, [0, 0, 0]);
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
    const rect = document.createElementNS(svgNameSpace, 'rect');
    const color = `hsl(${inputColor[0]}, ${inputColor[1]}%, ${inputColor[2]}%)`;
    rect.setAttribute('x', `-${width / 2}`);
    rect.setAttribute('y', `-${height / 2}`);
    rect.setAttribute('width', `${width}`);
    rect.setAttribute('height', `${height}`);
    rect.setAttribute('fill', color);
    return rect;
}
function addText(text, labelgroup) {
    const textElement = document.createElementNS(svgNameSpace, 'text');
    textElement.setAttribute('x', '21');
    textElement.setAttribute('y', '270');
    textElement.textContent = text;
    textElement.classList.add('label', 'hidden', labelgroup);
    return textElement;
}
function generateKeyboard() {
    const blackInfo = {
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
    const whiteInfo = {
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
    blackInfo.ids.forEach((id) => {
        const key = generateKeyElement(blackInfo, id);
        key.addEventListener("click", () => {
            //console.log("manual input: ", id);
            keyPressInterpret(id);
        });
        key.classList.add('black-key');
        $("blackRow").appendChild(key);
    });
    $('key-1').classList.add('hidden-key');
    whiteInfo.ids.forEach((id) => {
        const key = generateKeyElement(whiteInfo, id);
        key.addEventListener("click", () => {
            //console.log("manual input: ", id);
            keyPressInterpret(id);
        });
        $("whiteRow").appendChild(key);
    });
}
function keyAnimate(key) {
    const keyAnimate = key.querySelector('.key-animate-layer');
    keyAnimate.classList.remove('key-animate');
    setTimeout(() => {
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
    for (let i = 0; i < 13; i++) {
        const audioElement = new Howl({
            src: [`public/audio/organ${i}.ogg`]
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
        game.clock = setTimeout(correctSequence, 233);
    }
    else {
        game.playerSequenceIndex++;
    }
}
function playChord(chord, step, speed, callback) {
    hitKey(chord[step]);
    step++;
    if (step < chord.length) {
        game.clock = setTimeout(playChord, speed, chord, step, speed, callback);
    }
    else {
        callback();
    }
}
function computerPlaySequence(sequence) {
    const sequenceCopy = sequence.slice();
    //console.log(sequenceCopy);
    hitKey(sequenceCopy.shift());
    if (sequenceCopy.length > 0) {
        game.clock = setTimeout(computerPlaySequence, game.computerTempo, sequenceCopy);
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
    clearTimeout(game.clock);
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
    game.score++;
    $("scoreDisplay").textContent = String(game.score);
    game.clock = setTimeout(playChord, 233, chords.win, 0, 73, () => {
        game.clock = setTimeout(computerTurn, 1849);
    });
}
function freePlay() {
    clearTimeout(game.clock);
    $("container").className = "bg-free-play";
    $("replaySequenceBtn").classList.add("hidden");
    console.log("play however you like.  there is no rush");
    game.secretSequence = [];
    game.playerSequenceIndex = 0;
    game.playerTurn = true;
    game.freePlay = true;
    game.score = null;
    $("scoreDisplay").textContent = null;
}
function newGame() {
    clearTimeout(game.clock);
    game.playerTurn = false;
    game.freePlay = false;
    $("container").className = "bg-computer-turn";
    $("replaySequenceBtn").classList.remove("hidden");
    console.log("start new game!!!");
    game.secretSequence = [];
    game.playerSequenceIndex = 0;
    game.score = 0;
    $("scoreDisplay").textContent = String(game.score);
    game.clock = setTimeout(computerTurn, 987);
}
function playerTurn() {
    game.clock = setTimeout(function () {
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
    const root = Math.floor(Math.random() * 13);
    const badChord = [root];
    badChord.push((root + 6) % 13);
    badChord.push(Math.floor(Math.random() * 13));
    badChord.push((root + 1) % 13);
    badChord.push((root + 7) % 13);
    playChord(badChord, 0, 73, nop);
}
function addEventListeners() {
    $("labelVisibilityCheckbox").addEventListener("change", toggleLabelVisibility);
    $("newGameBtn").addEventListener("click", newGame);
    $("freePlayBtn").addEventListener("click", freePlay);
    $("replaySequenceBtn").addEventListener("click", replayComputerSequence);
    $("layoutSelector").addEventListener("change", function (event) {
        changeLayout(event.target.value);
    });
    document.addEventListener('keydown', (pressEvent) => {
        //console.log(pressEvent.key);
        //console.log("keyboard pressed:", layoutMap[game.layout][pressEvent.key]);
        keyPressInterpret(layoutMap[game.layout][pressEvent.key]);
        heldDownKey[layoutMap[game.layout][pressEvent.key]] = true;
    });
    document.addEventListener('keyup', (pressEvent) => {
        //console.log("keyboard released:", layoutMap[game.layout][pressEvent.key]);
        heldDownKey[layoutMap[game.layout][pressEvent.key]] = false;
    });
}
function main() {
    addEventListeners();
    generateKeyboard();
    generateSoundBank();
    freePlay();
}
main();
