/* ===============================
   1) PARTICLE BACKGROUND (animated)
   =============================== */
'use strict';

// Math constants and utilities
const { PI, abs, random, atan2, cos, sin } = Math;
const HALF_PI = 0.5 * PI;
const TAU = 2 * PI;
const TO_RAD = PI / 180;
const rand = n => n * random();
const randRange = n => n - rand(2 * n);
const fadeInOut = (t, m) => {
  const hm = 0.5 * m;
  return abs((t + hm) % m - hm) / hm;
};
const angle = (x1, y1, x2, y2) => atan2(y2 - y1, x2 - x1);
const lerp = (n1, n2, speed) => (1 - speed) * n1 + speed * n2;

const particleCount = 700;
const particlePropCount = 9;
const particlePropsLength = particleCount * particlePropCount;
const baseTTL = 100;
const rangeTTL = 500;
const baseSpeed = 0.1;
const rangeSpeed = 1;
const baseSize = 2;
const rangeSize = 10;
const baseHue = 10;
const rangeHue = 100;
const backgroundColor = 'hsla(60,50%,3%,1)';

let container, canvas, ctx, center, tick, particleProps;
let currentTheme = 'default';
let simplex;
let pipeProps;
let rayProps;

// Theme configurations
const themes = {
  default: {
    particleCount: 700,
    particlePropCount: 9,
    baseTTL: 100,
    rangeTTL: 500,
    baseSpeed: 0.1,
    rangeSpeed: 1,
    baseSize: 2,
    rangeSize: 10,
    baseHue: 10,
    rangeHue: 100,
    backgroundColor: 'hsla(60,50%,3%,1)',
    type: 'default'
  },
  swirl: {
    particleCount: 700,
    particlePropCount: 9,
    rangeY: 100,
    baseTTL: 50,
    rangeTTL: 150,
    baseSpeed: 0.1,
    rangeSpeed: 2,
    baseRadius: 1,
    rangeRadius: 4,
    baseHue: 220,
    rangeHue: 100,
    noiseSteps: 8,
    xOff: 0.00125,
    yOff: 0.00125,
    zOff: 0.0005,
    backgroundColor: 'hsla(260,40%,5%,1)',
    type: 'swirl'
  },
  pipeline: {
    pipeCount: 30,
    pipePropCount: 8,
    turnCount: 8,
    turnChanceRange: 58,
    baseSpeed: 0.5,
    rangeSpeed: 1,
    baseTTL: 100,
    rangeTTL: 300,
    baseWidth: 2,
    rangeWidth: 4,
    baseHue: 180,
    rangeHue: 60,
    backgroundColor: 'hsla(150,80%,1%,1)',
    type: 'pipeline',
    turnAmount: null
  },
  aurora: {
    rayCount: 500,
    rayPropCount: 8,
    baseLength: 200,
    rangeLength: 200,
    baseSpeed: 0.05,
    rangeSpeed: 0.1,
    baseWidth: 10,
    rangeWidth: 20,
    baseHue: 120,
    rangeHue: 60,
    baseTTL: 50,
    rangeTTL: 100,
    noiseStrength: 100,
    xOff: 0.0015,
    yOff: 0.0015,
    zOff: 0.0015,
    backgroundColor: 'hsla(220,60%,3%,1)',
    type: 'aurora'
  }
};

function setup() {
  // Load saved theme before creating canvas
  const savedTheme = localStorage.getItem('selectedTheme');
  if (savedTheme && themes[savedTheme]) {
    currentTheme = savedTheme;
  }
  
  createCanvas();
  resize();
  initParticles();
  draw();
}

function initParticles() {
  const theme = themes[currentTheme];
  tick = 0;
  
  if (theme.type === 'swirl') {
    if (!simplex) simplex = new SimplexNoise();
    const particlePropsLength = theme.particleCount * theme.particlePropCount;
    particleProps = new Float32Array(particlePropsLength);
    for (let i = 0; i < particlePropsLength; i += theme.particlePropCount) initParticle(i);
  } else if (theme.type === 'pipeline') {
    theme.turnAmount = (360 / theme.turnCount) * TO_RAD;
    const pipePropsLength = theme.pipeCount * theme.pipePropCount;
    pipeProps = new Float32Array(pipePropsLength);
    for (let i = 0; i < pipePropsLength; i += theme.pipePropCount) initParticle(i);
  } else if (theme.type === 'aurora') {
    if (!simplex) simplex = new SimplexNoise();
    const rayPropsLength = theme.rayCount * theme.rayPropCount;
    rayProps = new Float32Array(rayPropsLength);
    for (let i = 0; i < rayPropsLength; i += theme.rayPropCount) initParticle(i);
  } else {
    const particlePropsLength = theme.particleCount * theme.particlePropCount;
    particleProps = new Float32Array(particlePropsLength);
    for (let i = 0; i < particlePropsLength; i += theme.particlePropCount) initParticle(i);
  }
}

function initParticle(i) {
  const theme = themes[currentTheme];
  
  if (theme.type === 'swirl') {
    const x = rand(canvas.a.width);
    const y = center[1] + randRange(theme.rangeY);
    const vx = 0;
    const vy = 0;
    const life = 0;
    const ttl = theme.baseTTL + rand(theme.rangeTTL);
    const speed = theme.baseSpeed + rand(theme.rangeSpeed);
    const radius = theme.baseRadius + rand(theme.rangeRadius);
    const hue = theme.baseHue + rand(theme.rangeHue);
    particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  } else if (theme.type === 'pipeline') {
    const x = rand(canvas.a.width);
    const y = center[1];
    const direction = (Math.round(rand(1)) ? HALF_PI : TAU - HALF_PI);
    const speed = theme.baseSpeed + rand(theme.rangeSpeed);
    const life = 0;
    const ttl = theme.baseTTL + rand(theme.rangeTTL);
    const width = theme.baseWidth + rand(theme.rangeWidth);
    const hue = theme.baseHue + rand(theme.rangeHue);
    pipeProps.set([x, y, direction, speed, life, ttl, width, hue], i);
  } else if (theme.type === 'aurora') {
    const length = theme.baseLength + rand(theme.rangeLength);
    const x = rand(canvas.a.width);
    let y1 = center[1] + theme.noiseStrength;
    let y2 = center[1] + theme.noiseStrength - length;
    const n = simplex.noise3D(x * theme.xOff, y1 * theme.yOff, tick * theme.zOff) * theme.noiseStrength;
    y1 += n;
    y2 += n;
    const life = 0;
    const ttl = theme.baseTTL + rand(theme.rangeTTL);
    const width = theme.baseWidth + rand(theme.rangeWidth);
    const speed = theme.baseSpeed + rand(theme.rangeSpeed) * (Math.round(rand(1)) ? 1 : -1);
    const hue = theme.baseHue + rand(theme.rangeHue);
    rayProps.set([x, y1, y2, life, ttl, width, speed, hue], i);
  } else {
    const x = rand(canvas.a.width);
    const y = rand(canvas.a.height);
    const theta = angle(x, y, center[0], center[1]);
    const vx = Math.cos(theta) * 6;
    const vy = Math.sin(theta) * 6;
    const life = 0;
    const ttl = theme.baseTTL + rand(theme.rangeTTL);
    const speed = theme.baseSpeed + rand(theme.rangeSpeed);
    const size = theme.baseSize + rand(theme.rangeSize);
    const hue = theme.baseHue + rand(theme.rangeHue);
    particleProps.set([x, y, vx, vy, life, ttl, speed, size, hue], i);
  }
}

function drawParticles() {
  const theme = themes[currentTheme];
  if (theme.type === 'pipeline') {
    const pipePropsLength = theme.pipeCount * theme.pipePropCount;
    for (let i = 0; i < pipePropsLength; i += theme.pipePropCount) updateParticle(i);
  } else if (theme.type === 'aurora') {
    const rayPropsLength = theme.rayCount * theme.rayPropCount;
    for (let i = 0; i < rayPropsLength; i += theme.rayPropCount) updateParticle(i);
  } else {
    const particlePropsLength = theme.particleCount * theme.particlePropCount;
    for (let i = 0; i < particlePropsLength; i += theme.particlePropCount) updateParticle(i);
  }
}

function updateParticle(i) {
  const theme = themes[currentTheme];
  const i2=i+1,i3=i+2,i4=i+3,i5=i+4,i6=i+5,i7=i+6,i8=i+7,i9=i+8;
  
  if (theme.type === 'pipeline') {
    let x = pipeProps[i];
    let y = pipeProps[i2];
    let direction = pipeProps[i3];
    const speed = pipeProps[i4];
    let life = pipeProps[i5];
    const ttl = pipeProps[i6];
    const width = pipeProps[i7];
    const hue = pipeProps[i8];
    
    drawPipeline(x, y, life, ttl, width, hue);
    
    life++;
    x += cos(direction) * speed;
    y += sin(direction) * speed;
    const turnChance = !(tick % Math.round(rand(theme.turnChanceRange))) && (!(Math.round(x) % 6) || !(Math.round(y) % 6));
    const turnBias = Math.round(rand(1)) ? -1 : 1;
    direction += turnChance ? theme.turnAmount * turnBias : 0;
    
    pipeProps[i] = x;
    pipeProps[i2] = y;
    pipeProps[i3] = direction;
    pipeProps[i5] = life;
    
    // Wrap around bounds - don't reinitialize, just wrap
    if (x > canvas.a.width) pipeProps[i] = 0;
    if (x < 0) pipeProps[i] = canvas.a.width;
    if (y > canvas.a.height) pipeProps[i2] = 0;
    if (y < 0) pipeProps[i2] = canvas.a.height;
    
    if (life > ttl) initParticle(i);
    return;
  }
  
  if (theme.type === 'aurora') {
    let x = rayProps[i];
    const y1 = rayProps[i2];
    const y2 = rayProps[i3];
    let life = rayProps[i4];
    const ttl = rayProps[i5];
    const width = rayProps[i6];
    const speed = rayProps[i7];
    const hue = rayProps[i8];
    
    drawAurora(x, y1, y2, life, ttl, width, hue);
    
    x += speed;
    life++;
    
    rayProps[i] = x;
    rayProps[i4] = life;
    
    const outOfBounds = x < 0 || x > canvas.a.width;
    if (outOfBounds || life > ttl) initParticle(i);
    return;
  }
  
  const x = particleProps[i];
  const y = particleProps[i2];
  
  if (theme.type === 'swirl') {
    const n = simplex.noise3D(x * theme.xOff, y * theme.yOff, tick * theme.zOff) * theme.noiseSteps * TAU;
    const vx = lerp(particleProps[i3], Math.cos(n), 0.5);
    const vy = lerp(particleProps[i4], Math.sin(n), 0.5);
    let life = particleProps[i5];
    const ttl = particleProps[i6];
    const speed = particleProps[i7];
    const x2 = x + vx * speed;
    const y2 = y + vy * speed;
    const radius = particleProps[i8];
    const hue = particleProps[i9];
    drawParticleSwirl(x, y, x2, y2, life, ttl, radius, hue);
    life++;
    particleProps[i] = x2;
    particleProps[i2] = y2;
    particleProps[i3] = vx;
    particleProps[i4] = vy;
    particleProps[i5] = life;
    const outOfBounds = x > canvas.a.width || x < 0 || y > canvas.a.height || y < 0;
    if (outOfBounds || life > ttl) initParticle(i);
  } else {
    const theta = angle(x, y, center[0], center[1]) + 0.75 * HALF_PI;
    const vx = lerp(particleProps[i3], 2 * Math.cos(theta), 0.05);
    const vy = lerp(particleProps[i4], 2 * Math.sin(theta), 0.05);
    let life = particleProps[i5];
    const ttl = particleProps[i6];
    const speed = particleProps[i7];
    const x2 = x + vx * speed;
    const y2 = y + vy * speed;
    const size = particleProps[i8];
    const hue = particleProps[i9];
    drawParticle(x, y, theta, life, ttl, size, hue);
    life++;
    particleProps[i]  = x2;
    particleProps[i2] = y2;
    particleProps[i3] = vx;
    particleProps[i4] = vy;
    particleProps[i5] = life;
    if (life > ttl) initParticle(i);
  }
}

function drawParticle(x, y, theta, life, ttl, size, hue) {
  const xRel = x - (0.5 * size);
  const yRel = y - (0.5 * size);
  ctx.a.save();
  ctx.a.lineCap = 'round';
  ctx.a.lineWidth = 1;
  ctx.a.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
  ctx.a.beginPath();
  ctx.a.translate(xRel, yRel);
  ctx.a.rotate(theta);
  ctx.a.translate(-xRel, -yRel);
  ctx.a.strokeRect(xRel, yRel, size, size);
  ctx.a.closePath();
  ctx.a.restore();
}

function drawParticleSwirl(x, y, x2, y2, life, ttl, radius, hue) {
  ctx.a.save();
  ctx.a.lineCap = 'round';
  ctx.a.lineWidth = radius;
  ctx.a.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
  ctx.a.beginPath();
  ctx.a.moveTo(x, y);
  ctx.a.lineTo(x2, y2);
  ctx.a.stroke();
  ctx.a.closePath();
  ctx.a.restore();
}

function drawPipeline(x, y, life, ttl, width, hue) {
  ctx.a.save();
  ctx.a.strokeStyle = `hsla(${hue},75%,50%,${fadeInOut(life, ttl) * 0.125})`;
  ctx.a.beginPath();
  ctx.a.arc(x, y, width, 0, TAU);
  ctx.a.stroke();
  ctx.a.closePath();
  ctx.a.restore();
}

function drawAurora(x, y1, y2, life, ttl, width, hue) {
  const gradient = ctx.a.createLinearGradient(x, y1, x, y2);
  gradient.addColorStop(0, `hsla(${hue},100%,65%,0)`);
  gradient.addColorStop(0.5, `hsla(${hue},100%,65%,${fadeInOut(life, ttl)})`);
  gradient.addColorStop(1, `hsla(${hue},100%,65%,0)`);
  
  ctx.a.save();
  ctx.a.beginPath();
  ctx.a.strokeStyle = gradient;
  ctx.a.lineWidth = width;
  ctx.a.moveTo(x, y1);
  ctx.a.lineTo(x, y2);
  ctx.a.stroke();
  ctx.a.closePath();
  ctx.a.restore();
}

function createCanvas() {
  container = document.querySelector('.content--canvas');
  canvas = { a: document.createElement('canvas'), b: document.createElement('canvas') };
  canvas.b.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  `;
  if (container) container.appendChild(canvas.b);
  ctx = { a: canvas.a.getContext('2d'), b: canvas.b.getContext('2d') };
  center = [];
}

function resize() {
  const { innerWidth, innerHeight } = window;
  canvas.a.width = innerWidth;
  canvas.a.height = innerHeight;
  canvas.b.width = innerWidth;
  canvas.b.height = innerHeight;
  center[0] = 0.5 * innerWidth;
  center[1] = 0.5 * innerHeight;
}


function renderGlow() {
  const theme = themes[currentTheme];
  
  if (theme.type === 'aurora') {
    ctx.b.save();
    ctx.b.filter = 'blur(12px)';
    ctx.a.globalCompositeOperation = 'lighter';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();
  } else if (theme.type === 'pipeline') {
    // Pipeline uses its own render method
    return;
  } else {
    ctx.b.save();
    ctx.b.filter = 'blur(8px) brightness(200%)';
    ctx.b.globalCompositeOperation = 'lighter';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();

    ctx.b.save();
    ctx.b.filter = 'blur(4px) brightness(200%)';
    ctx.b.globalCompositeOperation = 'lighter';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();
  }
}

function render() {
  const theme = themes[currentTheme];
  
  if (theme.type === 'pipeline') {
    // Pipeline's custom render
    ctx.b.save();
    ctx.b.fillStyle = theme.backgroundColor;
    ctx.b.fillRect(0, 0, canvas.b.width, canvas.b.height);
    ctx.b.restore();

    ctx.b.save();
    ctx.b.filter = 'blur(12px)';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();

    ctx.b.save();
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();
  } else {
    ctx.b.save();
    ctx.b.globalCompositeOperation = 'lighter';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();
  }
}

function draw() {
  const theme = themes[currentTheme];
  tick++;
  
  if (theme.type === 'pipeline') {
    // Pipeline doesn't clear canvas to create trails
    drawParticles();
    render();
  } else if (theme.type === 'aurora') {
    ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);
    ctx.b.fillStyle = theme.backgroundColor;
    ctx.b.fillRect(0, 0, canvas.b.width, canvas.a.height);
    drawParticles();
    renderGlow();
  } else {
    ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);
    ctx.b.fillStyle = theme.backgroundColor;
    ctx.b.fillRect(0, 0, canvas.a.width, canvas.a.height);
    drawParticles();
    renderGlow();
    render();
  }
  
  requestAnimationFrame(draw);
}


window.addEventListener('load', setup);
window.addEventListener('resize', resize);



/* ===============================
   2) THEME SYSTEM
   =============================== */

function switchTheme(themeName) {
  currentTheme = themeName;
  const theme = themes[themeName];
  
  // Only reinitialize if canvas exists (already set up)
  if (!canvas || !ctx) {
    // Just save preference, will be applied when setup() runs
    localStorage.setItem('selectedTheme', themeName);
    return;
  }
  
  // Clear both canvases when switching themes
  ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);
  ctx.b.clearRect(0, 0, canvas.b.width, canvas.b.height);
  
  // Update global variables based on theme
  if (theme.type === 'swirl' || theme.type === 'aurora') {
    if (!simplex) simplex = new SimplexNoise();
  }
  
  // Reinitialize particles with new theme
  initParticles();
  
  // Save preference
  localStorage.setItem('selectedTheme', themeName);
}

/* ===============================
   3) UNBLOCKED HUB APP LOGIC + FULLSCREEN
   =============================== */
document.addEventListener('DOMContentLoaded', () => {
  // Settings dropdown toggle
  const settingsBtn = document.getElementById('settings-btn');
  const settingsDropdown = document.getElementById('settings-dropdown');
  
  settingsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('is-open');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!settingsDropdown?.contains(e.target) && e.target !== settingsBtn) {
      settingsDropdown?.classList.remove('is-open');
    }
  });
  
  // Theme switching
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      switchTheme(theme);
      settingsDropdown?.classList.remove('is-open');
    });
  });
  
  // Theme is already loaded in setup(), just update UI if needed
  // No need to call switchTheme here since setup() already applied the saved theme
  const screens = {
    home:   document.getElementById('home-screen'),
    games:  document.getElementById('games-screen'),
    apps:   document.getElementById('apps-screen'),
    changelog: document.getElementById('changelog-screen'),
    'changelog-detail': document.getElementById('changelog-detail-screen'),
    viewer: document.getElementById('viewer-screen')
  };
  const viewerFrame  = document.getElementById('viewer-frame');
  const viewerTitle  = document.getElementById('viewer-title');
  const viewerReload = document.getElementById('viewer-reload');
  const viewerBack   = document.getElementById('viewer-back');
  const viewerFSBtn  = document.getElementById('viewer-fullscreen');
  const viewerWrap   = document.querySelector('.viewer-frame-wrap');

  // navigation
  function showScreen(route) {
    Object.values(screens).forEach(s => s.classList.add('is-hidden'));
    screens[route]?.classList.remove('is-hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('is-active', b.dataset.route === route));
    currentRoute = route;
  }

  let currentRoute = 'home';
  showScreen('home');

  // open game/app in viewer
  function openInViewer(url, title='Viewer') {
    viewerFrame.src = '';
    viewerTitle.textContent = title;
    viewerFrame.setAttribute('sandbox',
      'allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-modals allow-presentation allow-downloads'
    );
    viewerFrame.setAttribute('allow', 'fullscreen *; autoplay *; gamepad *;');
    showScreen('viewer');
    setTimeout(() => viewerFrame.src = url, 50);
  }

  function openPickaxeEmbed() {
    // Hide the main content
    document.getElementById('app').style.display = 'none';
    document.querySelector('.site-header').style.display = 'none';
    document.getElementById('robot-btn').style.display = 'none';
    document.querySelector('.content--canvas').style.display = 'none';

    // Create full-screen overlay
    const overlay = document.createElement('div');
    overlay.id = 'pickaxe-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--bg-deep);
      z-index: 10000;
      display: flex;
      flex-direction: column;
    `;

    // Create header with close button
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: linear-gradient(0deg, rgba(25, 25, 15, 0.72), rgba(0,0,0,0.2));
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 223, 128, 0.12);
      box-shadow: 0 2px 18px rgba(0, 0, 0, 0.35);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Pickaxe Studio';
    title.style.cssText = `
      color: var(--gold-1);
      font-size: 1.4rem;
      font-weight: 700;
      text-shadow: 0 0 10px rgba(185,151,30,.25);
      margin: 0;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: transparent;
      color: var(--gold-1);
      border: 1px solid rgba(255, 223, 128, 0.28);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      font-size: 24px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = 'rgba(245, 215, 110, 0.12)';
      closeBtn.style.borderColor = 'rgba(255, 223, 128, 0.45)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.borderColor = 'rgba(255, 223, 128, 0.28)';
    };
    closeBtn.onclick = () => closePickaxeEmbed();

    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      padding: 2rem;
      overflow: auto;
    `;

    // Add the Pickaxe embed div
    const embedDiv = document.createElement('div');
    embedDiv.id = 'deployment-4e226b77-885c-4744-ba1a-317f0958eae5';

    // Add the script
    const script = document.createElement('script');
    script.src = 'https://studio.pickaxe.co/api/embed/bundle.js';
    script.defer = true;

    // Assemble
    header.appendChild(title);
    header.appendChild(closeBtn);
    content.appendChild(embedDiv);
    overlay.appendChild(header);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    document.body.appendChild(script);

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closePickaxeEmbed();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  function closePickaxeEmbed() {
    // Remove overlay
    const overlay = document.getElementById('pickaxe-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }

    // Remove any Pickaxe scripts that might have been added
    const scripts = document.querySelectorAll('script[src*="pickaxe"]');
    scripts.forEach(script => script.remove());

    // Show main content again
    document.getElementById('app').style.display = '';
    document.querySelector('.site-header').style.display = '';
    document.getElementById('robot-btn').style.display = '';
    document.querySelector('.content--canvas').style.display = '';
  }

  // delegated clicks
  document.addEventListener('click', e => {
    // Skip if clicking on settings button or dropdown
    if (e.target.closest('.settings-container')) return;

    const route = e.target.closest('[data-route]');
    if (route) {
      e.preventDefault();
      // Special case for emulator button
      if (route.dataset.route === 'emulator') {
        openInViewer('https://demo.emulatorjs.org', 'EmulatorJS');
      } else {
        showScreen(route.dataset.route);
      }
      return;
    }

    const opener = e.target.closest('.open-in-viewer');
    if (opener) { e.preventDefault(); openInViewer(opener.dataset.url, opener.dataset.title); return; }

    // Handle changelog details button
    const changelogBtn = e.target.closest('.changelog-details-btn');
    if (changelogBtn) {
      e.preventDefault();
      const card = changelogBtn.closest('.card');
      const diffContent = card.querySelector('.changelog-diff')?.innerHTML || 'No details available';
      const title = card.querySelector('h3')?.textContent || 'Changelog';
      const desc = card.querySelector('.card-info p')?.textContent || '';
      
      // Display in full-screen changelog detail view
      document.getElementById('changelog-detail-title').textContent = title;
      document.getElementById('changelog-detail-desc').textContent = desc;
      document.getElementById('changelog-detail-diff').innerHTML = diffContent;
      
      showScreen('changelog-detail');
      return;
    }

    if (e.target.closest('.back-to-home') || e.target.id === 'viewer-back') {
      e.preventDefault(); showScreen('home'); return;
    }
    if (e.target.id === 'viewer-reload') {
      e.preventDefault();
      const src = viewerFrame.src;
      viewerFrame.src = ''; setTimeout(() => viewerFrame.src = src, 40);
    }

    // Handle robot button click
    if (e.target.id === 'robot-btn' || e.target.closest('#robot-btn')) {
      e.preventDefault();
      openPickaxeEmbed();
      return;
    }
  });

  /* ===== FULLSCREEN LOGIC ===== */
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  async function enterFullscreen(el) {
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch (e) { console.warn(e); }
  }
  async function exitFullscreen() {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    } catch (e) { console.warn(e); }
  }
  async function toggleFullscreen() {
    if (!viewerWrap) return;
    if (isFullscreen()) await exitFullscreen();
    else await enterFullscreen(viewerWrap);
  }
  function syncFSButton() {
    const fs = isFullscreen();
    viewerFSBtn?.setAttribute('aria-pressed', String(fs));
    viewerFSBtn.textContent = fs ? '🗗' : '⛶';
  }

  viewerFSBtn?.addEventListener('click', e => { e.preventDefault(); toggleFullscreen(); });
  viewerWrap?.addEventListener('dblclick', e => { e.preventDefault(); toggleFullscreen(); });
  document.addEventListener('keydown', e => {
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const visible = !screens.viewer.classList.contains('is-hidden');
      if (visible) { e.preventDefault(); toggleFullscreen(); }
    }
  });
  ['fullscreenchange','webkitfullscreenchange'].forEach(ev =>
    document.addEventListener(ev, syncFSButton)
  );
  syncFSButton();

  // Changelog detail back button
  document.getElementById('changelog-detail-back')?.addEventListener('click', () => {
    showScreen('changelog');
  });

  /* === FEATURE 8: BACK TO TOP BUTTON === */
  const backToTopBtn = document.createElement('button');
  backToTopBtn.id = 'back-to-top';
  backToTopBtn.className = 'back-to-top-btn';
  backToTopBtn.textContent = '⬆️ TOP';
  backToTopBtn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(backToTopBtn);

  const appContainer = document.getElementById('app');

  // Listen to both window scroll and app scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  appContainer?.addEventListener('scroll', () => {
    if (appContainer.scrollTop > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Scroll the app container, not the window
    if (appContainer) {
      appContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* === FEATURE 10: CUSTOM PROXY URL (session-only) === */
  const customProxySection = document.createElement('div');
  customProxySection.className = 'settings-card';
  customProxySection.style.flexDirection = 'column';
  customProxySection.style.alignItems = 'flex-start';
  customProxySection.innerHTML = `
    <div class="card-info">
      <h4>Add Custom Proxy</h4>
      <p>Session-only custom proxy URL</p>
    </div>
    <div style="width: 100%; display: flex; gap: 0.5rem; margin-top: 0.5rem;">
      <input type="text" id="custom-proxy-input" placeholder="https://..." style="flex: 1; padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255, 223, 128, 0.28); background: rgba(34, 34, 18, 0.82); color: var(--text);">
      <button id="add-custom-proxy-btn" style="padding: 0.5rem 1rem; background: linear-gradient(90deg, var(--gold-1), var(--gold-2)); border: none; border-radius: 8px; color: #1a1606; cursor: pointer; font-weight: 700;">Add</button>
    </div>
  `;

  const proxySelect = document.getElementById('proxy-select');
  if (proxySelect && proxySelect.parentElement) {
    proxySelect.parentElement.parentElement.appendChild(customProxySection);
  }

  document.getElementById('add-custom-proxy-btn')?.addEventListener('click', () => {
    const customUrl = document.getElementById('custom-proxy-input').value.trim();
    if (customUrl) {
      const option = document.createElement('option');
      option.value = customUrl;
      option.textContent = 'Custom: ' + new URL(customUrl).hostname;
      proxySelect.appendChild(option);
      proxySelect.value = customUrl;
      localStorage.setItem('selectedProxyUrl', customUrl);
      document.getElementById('custom-proxy-input').value = '';
      alert('Custom proxy added for this session!');
    }
  });

  /* === FEATURE 11: PROXY SPEED TESTER === */
  const speedTestSection = document.createElement('div');
  speedTestSection.className = 'settings-card';
  speedTestSection.style.flexDirection = 'column';
  speedTestSection.style.alignItems = 'flex-start';
  speedTestSection.innerHTML = `
    <div class="card-info">
      <h4>Proxy Speed Test</h4>
      <p>Test latency of each proxy</p>
    </div>
    <button id="test-proxy-speed-btn" style="width: 100%; margin-top: 0.5rem; padding: 0.6rem; background: linear-gradient(90deg, var(--gold-1), var(--gold-2)); border: none; border-radius: 8px; color: #1a1606; cursor: pointer; font-weight: 700;">Test Speed</button>
    <div id="speed-results" style="width: 100%; margin-top: 1rem; color: var(--muted); font-size: 0.9rem; max-height: 200px; overflow-y: auto;"></div>
  `;

  if (proxySelect && proxySelect.parentElement) {
    proxySelect.parentElement.parentElement.appendChild(speedTestSection);
  }

  document.getElementById('test-proxy-speed-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('test-proxy-speed-btn');
    const resultsDiv = document.getElementById('speed-results');
    btn.disabled = true;
    btn.textContent = 'Testing...';
    resultsDiv.innerHTML = 'Testing proxies...';

    const proxies = Array.from(document.querySelectorAll('#proxy-select option')).map(opt => ({
      name: opt.textContent,
      url: opt.value
    }));

    const results = [];

    for (const proxy of proxies) {
      try {
        const start = performance.now();
        await fetch(proxy.url, { method: 'HEAD', mode: 'no-cors' });
        const end = performance.now();
        const latency = Math.round(end - start);
        results.push(`${proxy.name}: ${latency}ms`);
      } catch (e) {
        results.push(`${proxy.name}: ❌ Failed`);
      }
    }

    resultsDiv.innerHTML = results.map(r => `<div style="padding: 0.3rem 0;">${r}</div>`).join('');
    btn.disabled = false;
    btn.textContent = 'Test Speed';
  });
});

/* ===============================
   4) SECTION SEARCH (Games + Apps)
   =============================== */
/* ===============================
   4) SECTION SEARCH (Games + Apps)
   =============================== */
(function () {
  // utilities
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  const escapeHTML = s => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const debounce = (fn, ms=80) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

  // simple scoring (prefix > subsequence > miss)
  function score(needle, hay) {
    if (!needle) return 1;
    if (hay.startsWith(needle)) return 200 - hay.length; // strong boost for prefixes
    let i=0, hits=0;
    for (const c of hay) { if (c === needle[i]) { i++; hits++; if (i===needle.length) break; } }
    return (hits === needle.length) ? 50 - (hay.length - hits) : -1;
  }

  // main initializer per section
  function initSectionSearch({sectionEl, listEl, placeholder, lsKey, countAllLabel}) {
    if (!sectionEl) return;
    const header = sectionEl.querySelector('.screen-header');
    if (!header) return;

    // build UI
    const wrap = document.createElement('div');
    wrap.className = 'search-wrap';
    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'search-input';
    input.placeholder = placeholder;
    input.setAttribute('aria-label', placeholder);
    const count = document.createElement('div');
    count.className = 'search-count';
    count.textContent = countAllLabel;
    wrap.append(input, count);
    header.appendChild(wrap);

    // collect items
    const container = listEl || sectionEl;
    const cards = Array.from(container.querySelectorAll('.card'));
    const items = cards.map(card => {
      const titleEl = card.querySelector('h3');
      const descEl  = card.querySelector('p');
      const openBtn = card.querySelector('.open-in-viewer');
      const title   = (titleEl?.textContent || '').trim();
      const desc    = (descEl?.textContent || '').trim();
      return { card, titleEl, descEl, openBtn, title, desc };
    });

    // empty state
    const noRes = document.createElement('div');
    noRes.className = 'no-results';
    noRes.textContent = 'No results.';
    let noResShown = false;
    const showNoRes = show => {
      if (show && !noResShown) { container.appendChild(noRes); noResShown = true; }
      if (!show && noResShown) { noRes.remove(); noResShown = false; }
    };

    // highlight helper (no stray backslashes)
    function highlight(el, originalText, q) {
      if (!el) return;
      if (!q) { el.textContent = originalText; return; }
      const safe = escapeHTML(originalText);
      const re = new RegExp(`(${escRe(q)})`, 'ig');
      el.innerHTML = safe.replace(re, '<mark class="match">$1</mark>');
    }

    // which items are visible after filter
    const visibleItems = () => items.filter(it => !it.card.classList.contains('is-hidden-search'));

    let focusIdx = -1;
    function setFocus(idx) {
      items.forEach(it => it.card.classList.remove('is-focused'));
      const vis = visibleItems();
      if (!vis.length) { focusIdx = -1; return; }
      if (idx < 0) idx = 0;
      if (idx >= vis.length) idx = vis.length - 1;
      vis[idx].card.classList.add('is-focused');
      vis[idx].card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      focusIdx = idx;
    }

    // === THE SEARCH ===
    function runSearch(raw) {
      const q = norm(raw);

      // reset states & un-highlight
      items.forEach(it => {
        it.card.classList.remove('is-dim','is-focused','is-hidden-search');
        if (it.titleEl) it.titleEl.textContent = it.title; // restore plain text (fixes \ issues)
      });

      // nothing typed → show all
      if (!q) {
        count.textContent = countAllLabel;
        showNoRes(false);
        // keep caret in input
        input.focus();
        const pos = input.value.length;
        input.setSelectionRange(pos, pos);
        return;
      }

      // rank + hide unmatched
      const ranked = items.map(it => {
        const t = norm(it.title), d = norm(it.desc);
        return { it, s: Math.max(score(q, t), score(q, d)) };
      });

      let shown = 0;
      ranked.forEach(({ it, s }) => {
        if (s < 0) {
          it.card.classList.add('is-hidden-search');  // HIDE non-matches
        } else {
          shown++;
          highlight(it.titleEl, it.title, raw);       // highlight matches
        }
      });

      count.textContent = shown ? `${shown} result${shown===1?'':'s'}` : '0 results';
      showNoRes(shown === 0);

      // optional: set a visual focus, but DO NOT steal keyboard focus
      if (shown > 0) setFocus(0);

      // explicitly keep caret in the input after DOM updates
      input.focus();
      const pos = input.value.length;
      input.setSelectionRange(pos, pos);

      // remember query
      localStorage.setItem(lsKey, raw || '');
    }

    // wire events
    const debounced = debounce(runSearch, 60);

    input.addEventListener('input', e => debounced(e.target.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        input.value = '';
        runSearch('');
        return;
      }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocus(focusIdx + 1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocus(focusIdx - 1); }
      if (e.key === 'Enter') {
        const vis = visibleItems();
        const target = (focusIdx >= 0 ? vis[focusIdx] : vis[0]);
        target?.openBtn?.click();
      }
    });

    // boot with saved query (keeps caret)
    const saved = localStorage.getItem(lsKey) || '';
    if (saved) input.value = saved;
    runSearch(saved);

    // expose a focuser for when the section is navigated to
    return () => { input.focus(); input.select(); };
  }

  // init for both sections
  const focusers = {};
  focusers.games = initSectionSearch({
    sectionEl: document.getElementById('games-screen'),
    listEl: document.getElementById('games-list'),
    placeholder: 'Search games (e.g., minecraft, slope, 1v1…)',
    lsKey: 'uhub.search.games',
    countAllLabel: 'All games'
  });
  focusers.apps = initSectionSearch({
    sectionEl: document.getElementById('apps-screen'),
    listEl: null,
    placeholder: 'Search apps (e.g., chatgpt, proxy, youtube…)',
    lsKey: 'uhub.search.apps',
    countAllLabel: 'All apps'
  });
  // init changelog search (same UI style as Games)
  focusers.changelog = initSectionSearch({
    sectionEl: document.getElementById('changelog-screen'),
    listEl: document.getElementById('changelog-list'),
    placeholder: 'Search changelog (e.g., bugfix, added, removed…)',
    lsKey: 'uhub.search.changelog',
    countAllLabel: 'All changes'
  });

  // when clicking navbar pills, autofocus the section search
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn[data-route], .pill.go-to[data-route]');
    if (!btn) return;
    const route = btn.getAttribute('data-route');
    setTimeout(() => {
      if (route === 'games' && typeof focusers.games === 'function') focusers.games();
      if (route === 'apps'  && typeof focusers.apps  === 'function') focusers.apps();
      if (route === 'changelog' && typeof focusers.changelog === 'function') focusers.changelog();
    }, 60);
  });
})();

/* ===============================
   5) NAVBAR QUICK SEARCH → Games
   =============================== */
(function () {
  const navbar = document.querySelector('.site-header .navbar');
  if (!navbar) return;

  // Find the Apps button to insert before/after
  const appsBtn = navbar.querySelector('.nav-btn[data-route="apps"]');

  // Build the compact input (reuse search-input styles)
  const quick = document.createElement('input');
  quick.type = 'search';
  quick.className = 'search-input';
  quick.placeholder = 'Search games…';
  quick.setAttribute('aria-label', 'Quick search games');

  // make it compact without extra CSS edit
  quick.style.width = '200px';
  quick.style.maxWidth = '36vw';
  quick.style.padding = '.45rem .75rem';

  // Insert just before Apps (or at end if not found)
  if (appsBtn) navbar.insertBefore(quick, appsBtn);
  else navbar.appendChild(quick);

  // helper to open the Games screen (uses your existing nav)
  function goToGames() {
    const btn = navbar.querySelector('.nav-btn[data-route="games"]');
    if (btn) btn.click();
  }

  // push the query into the Games search box and trigger filtering
  function syncToGames(q) {
    // ensure Games screen is visible first
    goToGames();
    setTimeout(() => {
      const gamesHeader = document.querySelector('#games-screen .screen-header');
      const gamesInput  = gamesHeader?.querySelector('.search-input'); // the section search we injected earlier
      if (!gamesInput) return;
      gamesInput.value = q;
      // fire input to re-run filter logic
      gamesInput.dispatchEvent(new Event('input', { bubbles: true }));
      // focus the main search for keyboard nav
      gamesInput.focus();
      gamesInput.select();
    }, 60);
  }

  // debounce typing so it doesn’t spam
  let t;
  quick.addEventListener('input', (e) => {
    const q = e.target.value || '';
    clearTimeout(t);
    t = setTimeout(() => syncToGames(q), 120);
  });

  // Enter = jump immediately; Esc = clear
  quick.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      syncToGames(quick.value || '');
    } else if (e.key === 'Escape') {
      quick.value = '';
      syncToGames('');
      quick.blur();
    }
  });
})();