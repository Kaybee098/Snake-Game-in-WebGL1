const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// --- 1. WEBGL SETUP (SHADERS) ---
// Vertex Shader: Maps coordinates and sets the size of our blocks
const vsSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        gl_PointSize = 20.0; 
    }
`;
// Fragment Shader: Colors our blocks
const fsSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
`;

// Compile Shaders
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}
const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
gl.linkProgram(program);
gl.useProgram(program);

const posAttr = gl.getAttribLocation(program, "a_position");
const colorUni = gl.getUniformLocation(program, "u_color");
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.enableVertexAttribArray(posAttr);
gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

// --- 2. GAME STATE ---
const step = 0.1; 
let snake = [ [0.0, 0.0], [-0.1, 0.0], [-0.2, 0.0] ]; 
let apple = [0.5, 0.5];
let dx = step;
let dy = 0.0;
let isGameOver = false;
let lastMoveTime = 0;

// Add your audio file here! 
// (Make sure you have a file named 'beep.mp3' in the same folder as your HTML file)
const eatSound = new Audio('beep.mp3');

// Random apple generator aligned to our 0.1 grid
function spawnApple() {
    let x = Math.round((Math.random() * 1.8 - 0.9) / step) * step;
    let y = Math.round((Math.random() * 1.8 - 0.9) / step) * step;
    apple = [x, y];
}

// --- 3. GAME LOGIC ---
function update() {
    if (isGameOver) return;

    // Calculate new head position
    let headX = snake[0][0] + dx;
    let headY = snake[0][1] + dy;

    // RULE 1: Wall Collision (No-go zone)
    if (headX > 1.0 || headX < -1.0 || headY > 1.0 || headY < -1.0) {
        gameOver("Hit the wall!");
        return;
    }

    // RULE 2: Self-Collision (Don't touch tail)
    // We start loop at 0 to check if the new head overlaps ANY existing body part
    for (let i = 0; i < snake.length; i++) {
        // We use a small distance check (0.05) because floating point math isn't perfectly exact
        if (Math.abs(headX - snake[i][0]) < 0.05 && Math.abs(headY - snake[i][1]) < 0.05) {
            gameOver("Bit your own tail!");
            return;
        }
    }

    // Move the snake (add new head)
    snake.unshift([headX, headY]);

// RULE 3: Eating the Apple (Growing)
    if (Math.abs(headX - apple[0]) < 0.05 && Math.abs(headY - apple[1]) < 0.05) {
        spawnApple(); // Leave the tail attached (snake grows)
        
        eatSound.currentTime = 0; // Rewind sound to the start
        eatSound.play();          // Play the sound!
        
        // --- ADD THIS LINE TO UPDATE THE SIDE PANEL SCORE ---
        document.getElementById('live-score').innerText = snake.length - 3;
        
    } else {
        snake.pop(); // Remove tail if no apple eaten
    }
}

function gameOver(reason) {
    isGameOver = true;
    
    // Grab our HTML overlay elements
    const overlay = document.getElementById("game-overlay");
    const reasonDisplay = document.getElementById("reason-text");
    const scoreDisplay = document.getElementById("score-text");
    
    // Inject the game stats into the overlay text
    reasonDisplay.innerText = reason;
    scoreDisplay.innerText = snake.length - 3;
    
    // Change display from "none" to "flex" to show it beautifully centered
    overlay.style.display = "flex";
}

// --- 4. DRAWING ---
function drawObject(coords, r, g, b) {
    gl.uniform4f(colorUni, r, g, b, 1.0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords.flat()), gl.STATIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, coords.length);
}

function render(time) {
    // Control game speed (move every 100ms)
    if (time - lastMoveTime > 100) {
        update();
        lastMoveTime = time;
    }

    // Clear screen
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!isGameOver) {
        drawObject([apple], 1.0, 0.0, 0.0); // Draw Red Apple
        drawObject(snake, 0.0, 1.0, 0.0);   // Draw Green Snake
    }

    requestAnimationFrame(render);
}

// --- 5. CONTROLS ---
window.addEventListener("keydown", (e) => {
    // Prevent 180-degree turns
    if (e.key === "ArrowUp" && dy === 0.0) { dx = 0.0; dy = step; }
    if (e.key === "ArrowDown" && dy === 0.0) { dx = 0.0; dy = -step; }
    if (e.key === "ArrowLeft" && dx === 0.0) { dx = -step; dy = 0.0; }
    if (e.key === "ArrowRight" && dx === 0.0) { dx = step; dy = 0.0; }
});

// Start game
spawnApple();
requestAnimationFrame(render);
