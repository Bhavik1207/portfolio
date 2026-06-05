import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

window.addEventListener('error', function(e) {
  console.error('GLOBAL ERROR:', e.message, e.filename, e.lineno, e.colno, e.error);
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.left = '0';
  div.style.zIndex = '999999';
  div.style.background = 'red';
  div.style.color = 'white';
  div.style.padding = '20px';
  div.innerText = 'ERROR: ' + e.message + ' at line ' + e.lineno;
  document.body.appendChild(div);
});

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({ 
  ignoreMobileResize: true 
});

/* ── Lenis Smooth Scroll Initialization ── */
let lenis;
try {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    // Sync scrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  } else {
    console.warn("Lenis smooth scroll not found. Falling back to native scrolling.");
  }
} catch (error) {
  console.error("Lenis initialization error:", error);
}

/* ═══════════════════════════════════════════════════
   1. PRELOADER
   ═══════════════════════════════════════════════════ */
const preloader = document.getElementById('preloader');
let dismissed = false;

function dismissPreloader() {
  if (dismissed) return;
  dismissed = true;
  if (preloader) preloader.classList.add('hidden');
  initHeroAnimations();
}

// 1. Try to wait for full page load, then dismiss smoothly
window.addEventListener('load', () => {
  setTimeout(dismissPreloader, 800);
});

// 2. HARD FALLBACK: If load event gets stuck (e.g. slow image), force dismiss after 2 seconds
setTimeout(dismissPreloader, 2000);

/* ═══════════════════════════════════════════════════
   2. CUSTOM CURSOR
   ═══════════════════════════════════════════════════ */
const cursor = document.getElementById('cursor');
const bgGlow = document.getElementById('bg-glow');
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let glowX = 0, glowY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  // Smooth easing follow — slight lag for premium feel
  cursorX += (mouseX - cursorX) * 0.15;
  cursorY += (mouseY - cursorY) * 0.15;

  // Background glow follows with a softer, liquid-like lag
  glowX += (mouseX - glowX) * 0.04;
  glowY += (mouseY - glowY) * 0.04;

  cursor.style.left = cursorX + 'px';
  cursor.style.top = cursorY + 'px';

  if (bgGlow) {
    bgGlow.style.left = glowX + 'px';
    bgGlow.style.top = glowY + 'px';
  }

  requestAnimationFrame(animateCursor);
}
animateCursor();

/* ═══════════════════════════════════════════════════
   3. THREE.JS — SPACE SPHERE (INFRACORP-STYLE)
   ═══════════════════════════════════════════════════ */
const canvas = document.getElementById('hero-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

// ─── Particle Sphere (planet viewed from space) ───
const sphereRadius = 2.5;
const sphereParticleCount = 1200;
const spherePositions = new Float32Array(sphereParticleCount * 3);
const sphereColors = new Float32Array(sphereParticleCount * 3);
const sphereSizes = new Float32Array(sphereParticleCount);

for (let i = 0; i < sphereParticleCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  // Slight surface variation for organic look
  const r = sphereRadius + (Math.random() - 0.5) * 0.3;

  spherePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  spherePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  spherePositions[i * 3 + 2] = r * Math.cos(phi);

  // Color distribution: cyan dominant, some blue, some violet highlights
  const c = Math.random();
  if (c < 0.5) {
    // Cyan / teal
    colors3(sphereColors, i, 0.05, 0.75, 0.85);
  } else if (c < 0.8) {
    // Blue
    colors3(sphereColors, i, 0.2, 0.5, 0.95);
  } else if (c < 0.95) {
    // Violet highlight
    colors3(sphereColors, i, 0.5, 0.25, 0.95);
  } else {
    // Bright white spark
    colors3(sphereColors, i, 0.85, 0.9, 1.0);
  }

  sphereSizes[i] = Math.random() * 2.0 + 0.3;
}

function colors3(arr, i, r, g, b) {
  arr[i * 3] = r;
  arr[i * 3 + 1] = g;
  arr[i * 3 + 2] = b;
}

const sphereGeometry = new THREE.BufferGeometry();
sphereGeometry.setAttribute('position', new THREE.BufferAttribute(spherePositions, 3));
sphereGeometry.setAttribute('color', new THREE.BufferAttribute(sphereColors, 3));
sphereGeometry.setAttribute('size', new THREE.BufferAttribute(sphereSizes, 1));

const sphereMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    varying float vAlpha;
    uniform float uTime;

    void main() {
      vColor = color;
      vec3 pos = position;

      // Gentle surface shimmer
      float wave = sin(uTime * 0.4 + pos.y * 3.0 + pos.x * 2.0) * 0.04;
      pos *= 1.0 + wave;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = size * (180.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      vAlpha = smoothstep(15.0, 3.0, length(mvPosition.xyz));
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float glow = exp(-d * 6.0) * 0.35 + smoothstep(0.5, 0.0, d) * 0.35;
      gl_FragColor = vec4(vColor, glow * vAlpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const sphere = new THREE.Points(sphereGeometry, sphereMaterial);
scene.add(sphere);

// ─── Orbital rings ───
function createOrbitRing(radius, particleCount, color, speed) {
  const ringPositions = new Float32Array(particleCount * 3);
  const ringSizes = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    ringPositions[i * 3] = Math.cos(angle) * radius;
    ringPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    ringPositions[i * 3 + 2] = Math.sin(angle) * radius;
    ringSizes[i] = Math.random() * 1.5 + 0.3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(ringSizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) } },
    vertexShader: `
      attribute float size;
      varying float vAlpha;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (120.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vAlpha = smoothstep(15.0, 3.0, length(mvPosition.xyz)) * 0.6;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = exp(-d * 5.0) * 0.7;
        gl_FragColor = vec4(uColor, glow * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const ring = new THREE.Points(geo, mat);
  ring.userData = { speed };
  return ring;
}

const ring1 = createOrbitRing(4.2, 200, '#06b6d4', 0.15);
ring1.rotation.x = 0.7;
ring1.rotation.z = 0.2;
scene.add(ring1);

const ring2 = createOrbitRing(5.0, 150, '#7c3aed', 0.1);
ring2.rotation.x = -0.5;
ring2.rotation.z = -0.3;
scene.add(ring2);

// ─── Background stars ───
const starCount = 300;
const starPositions = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 60;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
  starSizes[i] = Math.random() * 1.2;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.08,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// ─── Sphere glow aura ───
const glowGeo = new THREE.SphereGeometry(sphereRadius * 1.3, 32, 32);
const glowMat = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color('#06b6d4') },
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
      float pulse = 1.0 + sin(uTime * 0.5) * 0.15;
      gl_FragColor = vec4(uColor, intensity * 0.15 * pulse);
    }
  `,
  transparent: true,
  depthWrite: false,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending
});
const glowMesh = new THREE.Mesh(glowGeo, glowMat);
scene.add(glowMesh);



// Position sphere to the left like Infracorp
sphere.position.x = -5;
glowMesh.position.x = -5;
ring1.position.x = -5;
ring2.position.x = -5;

camera.position.z = 9;

// Mouse parallax
let targetRotX = 0, targetRotY = 0;
document.addEventListener('mousemove', (e) => {
  targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.15;
  targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.15;
});

// Animation loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  sphereMaterial.uniforms.uTime.value = t;
  glowMat.uniforms.uTime.value = t;

  // Slow sphere rotation
  sphere.rotation.y += 0.002;
  glowMesh.rotation.y = sphere.rotation.y;

  // Orbit rings
  ring1.rotation.y += ring1.userData.speed * 0.01;
  ring2.rotation.y -= ring2.userData.speed * 0.01;

  // Stars subtle drift
  stars.rotation.y += 0.0001;
  stars.rotation.x += 0.00005;

  // Smooth mouse parallax on entire scene group
  scene.rotation.x += (targetRotX - scene.rotation.x) * 0.02;
  scene.rotation.y += (targetRotY - scene.rotation.y) * 0.02;

  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Scroll-based opacity fade
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const heroHeight = window.innerHeight;
  const opacity = Math.max(0, 1 - scrollY / heroHeight);
  canvas.style.opacity = opacity;
});

/* ═══════════════════════════════════════════════════
   4. NAVIGATION
   ═══════════════════════════════════════════════════ */
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  mobileMenu.classList.toggle('active');
  document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
});

/* ═══════════════════════════════════════════════════
   5. HERO ANIMATIONS (GSAP)
   ═══════════════════════════════════════════════════ */
function initHeroAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  tl.from('.hero-tag', { opacity: 0, y: 20, duration: 1, delay: 0.2 })
    .from('.hero-word', { opacity: 0, y: 40, duration: 1.2, stagger: 0.15 }, '-=0.6')
    .from('.hero-subtitle', { opacity: 0, y: 20, duration: 1 }, '-=0.8')
    .from('.hero-description', { opacity: 0, y: 20, duration: 1 }, '-=0.7')
    .from('.hero-cta', { opacity: 0, y: 20, duration: 1 }, '-=0.6')
    .from('.hero-scroll-indicator', { opacity: 0, duration: 1 }, '-=0.4')
    .add(() => {
      ScrollTrigger.refresh();
    });
}

// Call hero animations immediately since we removed the preloader
initHeroAnimations();

/* ═══════════════════════════════════════════════════
   6. SCROLL ANIMATIONS (FRAME-BY-FRAME SCRUBBING)
   ═══════════════════════════════════════════════════ */

// ── Shared Scrub Configuration ──
const scrubConfig = {
  duration: 1,
  ease: 'power2.out',
  opacity: 0,
  y: 30,
};

// ── Section Labels ──
gsap.utils.toArray('.section-label').forEach(label => {
  gsap.fromTo(label, 
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0,
      scrollTrigger: {
        trigger: label,
        start: 'top 90%',
        end: 'top 70%',
        scrub: 0.5,
      }
    }
  );
});

// ── Section Titles ──
gsap.utils.toArray('.section-title').forEach(title => {
  gsap.fromTo(title, 
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0,
      scrollTrigger: {
        trigger: title,
        start: 'top 90%',
        end: 'top 70%',
        scrub: 0.5,
      }
    }
  );
});

// ── About Section ──
gsap.fromTo('.about-image-wrapper', 
  { opacity: 0, x: -50 },
  {
    opacity: 1, x: 0,
    scrollTrigger: {
      trigger: '.about-grid',
      start: 'top 90%',
      end: 'top 60%',
      scrub: 1,
    }
  }
);

gsap.fromTo('.about-content', 
  { opacity: 0, x: 50 },
  {
    opacity: 1, x: 0,
    scrollTrigger: {
      trigger: '.about-grid',
      start: 'top 85%',
      end: 'top 55%',
      scrub: 1,
    }
  }
);

// ── Stat Numbers (Scroll Triggered Count) ──
gsap.utils.toArray('.stat-number').forEach(num => {
  const target = parseInt(num.getAttribute('data-count'));
  ScrollTrigger.create({
    trigger: num,
    start: 'top 90%',
    onEnter: () => {
      gsap.to(num, {
        innerText: target,
        duration: 1.5,
        ease: 'power2.out',
        snap: { innerText: 1 },
        onUpdate: function () { num.textContent = Math.round(parseFloat(num.textContent)); }
      });
    }
  });
});

// ── Skills — Split Layout Scroll Animation ──
const skillsCards = gsap.utils.toArray('.skills-list-card');
if (skillsCards.length > 0) {
  skillsCards.forEach((card) => {
    gsap.fromTo(card, 
      { opacity: 0, y: 40 },
      {
        opacity: 1, 
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });
}

// ── Projects Section — Bento Grid (no horizontal scroll needed) ──
// Animate each bento card on scroll
gsap.utils.toArray('.project-bento-card').forEach((card, i) => {
  gsap.fromTo(card,
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0,
      duration: 0.8,
      delay: i === 0 ? 0 : (i % 2 === 0 ? 0.15 : 0),
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 92%',
        end: 'top 72%',
        scrub: false,
        toggleActions: 'play none none reverse',
      }
    }
  );
});

// ── Milestone Cards ──
gsap.utils.toArray('.milestone-card').forEach((card, i) => {
  gsap.fromTo(card, 
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0,
      scrollTrigger: {
        trigger: card,
        start: 'top 95%',
        end: 'top 80%',
        scrub: 0.5,
      }
    }
  );
});

// ── Certificates Section ──
gsap.fromTo('.certificates-marquee', 
  { opacity: 0, scale: 0.95 },
  {
    opacity: 1, scale: 1,
    scrollTrigger: {
      trigger: '.certificates',
      start: 'top 90%',
      end: 'top 60%',
      scrub: 1,
    }
  }
);

// ── Contact Section ──
gsap.fromTo('.contact-left', 
  { opacity: 0, x: -40 },
  {
    opacity: 1, x: 0,
    scrollTrigger: {
      trigger: '.contact-grid',
      start: 'top 90%',
      end: 'top 70%',
      scrub: 1,
    }
  }
);

gsap.fromTo('.contact-right', 
  { opacity: 0, x: 40 },
  {
    opacity: 1, x: 0,
    scrollTrigger: {
      trigger: '.contact-grid',
      start: 'top 85%',
      end: 'top 65%',
      scrub: 1,
    }
  }
);

// ── 3D Sphere Parallax Drift ──
gsap.to(sphere.position, {
  y: -2,
  scrollTrigger: {
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
  }
});

gsap.to(stars.rotation, {
  y: Math.PI * 0.5,
  scrollTrigger: {
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
  }
});

/* ═══════════════════════════════════════════════════
   7. PROJECT 3D SCENES — ALL THREE PROJECTS
   ═══════════════════════════════════════════════════ */
// Project 3D scenes removed to match 2D minimalist professional aesthetic

/* ═══════════════════════════════════════════════════
   8. CONTACT FORM
   ═══════════════════════════════════════════════════ */
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = document.getElementById('form-submit');
  const originalHTML = btn.innerHTML;

  const formData = new FormData(contactForm);
  // Simple local feedback since Netlify is not being used
  console.log("Form data collected:", Object.fromEntries(formData));
  
  // Visual success feedback
  btn.innerHTML = '<span>Message Sent! ✓</span>';
  btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.style.background = '';
    contactForm.reset();
  }, 3000);
});

/* ═══════════════════════════════════════════════════
   9. SMOOTH SCROLL
   ═══════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
