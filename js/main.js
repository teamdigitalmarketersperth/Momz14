/* Momz14 public site: navigation, original ambient preview, static audio, contact submissions. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const header = document.querySelector('.site-header');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const toggle = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const close = document.querySelector('.mobile-drawer-close');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  const setDrawer = (open) => {
    if (!drawer || !toggle) return;
    drawer.inert = !open;
    drawer.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    if (header) header.inert = open;
    (open ? close : toggle)?.focus();
  };
  toggle?.addEventListener('click', () => setDrawer(true));
  close?.addEventListener('click', () => setDrawer(false));
  drawer?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setDrawer(false)));
  drawer?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setDrawer(false);
    if (event.key !== 'Tab') return;
    const controls = [...drawer.querySelectorAll('a, button')];
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  });
  window.matchMedia('(min-width: 992px)').addEventListener('change', event => {
    if (event.matches && drawer?.classList.contains('active')) setDrawer(false);
  });

  const play = document.getElementById('audioPlayBtn');
  const icon = document.getElementById('playIcon');
  const seek = document.getElementById('audioProgressWrap');
  const elapsed = document.getElementById('audioCurrentTime');
  const total = document.getElementById('audioTotalTime');
  const volume = document.getElementById('audioVolume');
  const title = document.querySelector('.current-track-title');
  const description = document.querySelector('.track-description');
  const meta = document.querySelector('.current-track-meta');
  const status = document.getElementById('playerStatus');
  const catalog = document.querySelector('.music-catalog-table');
  const state = { duration: 214, time: 0, playing: false, source: '', volume: Number(volume?.value ?? .8) };
  const audio = document.getElementById('momzAudio');
  if (play && audio) {
    audio.volume = state.volume;
    let context;
    let gain;
    let timer;
    let playbackRequest = 0;
    const formatTime = (value) => {
      const seconds = Math.max(0, Math.floor(Number(value) || 0));
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    };
    const updatePlayer = () => {
      if (icon) icon.className = state.playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
      if (play) {
        play.setAttribute('aria-label', state.playing ? 'Pause track' : 'Play track');
        play.setAttribute('aria-pressed', String(state.playing));
      }
      if (seek) {
        seek.max = state.duration;
        seek.value = state.time;
        seek.setAttribute('aria-valuetext', `${formatTime(state.time)} of ${formatTime(state.duration)}`);
      }
      if (elapsed) elapsed.textContent = formatTime(state.time);
      if (total) total.textContent = formatTime(state.duration);
    };
    const stopPlayback = () => {
      playbackRequest += 1;
      audio.pause();
      clearInterval(timer);
      if (gain) gain.gain.setTargetAtTime(0, context.currentTime, .05);
      state.playing = false;
      updatePlayer();
    };
    const startPlayback = async () => {
      const request = ++playbackRequest;
      try {
        if (state.source) {
          await audio.play();
          if (request !== playbackRequest) return;
          if (status) status.textContent = 'Playing recording.';
        } else {
          // Preserve the original synth as an explicitly labeled preview, never a substituted recording.
          if (!context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) throw new Error('Audio unavailable');
            context = new AudioContext();
            gain = context.createGain();
            gain.gain.value = 0;
            gain.connect(context.destination);
            const oscillator = context.createOscillator();
            const filter = context.createBiquadFilter();
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 55;
            filter.type = 'lowpass';
            filter.frequency.value = 280;
            oscillator.connect(filter);
            filter.connect(gain);
            oscillator.start();
          }
          await context.resume();
          if (request !== playbackRequest) return;
          gain.gain.setTargetAtTime(state.volume * .12, context.currentTime, .05);
          clearInterval(timer);
          timer = setInterval(() => {
            state.time = Math.min(state.duration, state.time + 1);
            if (state.time === state.duration) { stopPlayback(); state.time = 0; }
            updatePlayer();
          }, 1000);
          if (status) status.textContent = 'Ambient synthesis preview. Full recording is not available yet.';
        }
        state.playing = true;
        updatePlayer();
      } catch {
        if (request !== playbackRequest) return;
        stopPlayback();
        if (status) status.textContent = 'Audio could not play. Try again, or choose another track.';
      }
    };
    play?.addEventListener('click', () => state.playing ? stopPlayback() : startPlayback());
    seek?.addEventListener('input', () => {
      state.time = Math.min(state.duration, Math.max(0, Number(seek.value)));
      if (state.source && Number.isFinite(audio.duration)) audio.currentTime = state.time;
      updatePlayer();
    });
    volume?.addEventListener('input', () => {
      state.volume = Number(volume.value);
      audio.volume = state.volume;
      if (gain && state.playing && !state.source) gain.gain.setTargetAtTime(state.volume * .12, context.currentTime, .05);
    });
    audio.addEventListener('timeupdate', () => {
      if (state.source) { state.time = audio.currentTime; updatePlayer(); }
    });
    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) { state.duration = audio.duration; updatePlayer(); }
    });
    audio.addEventListener('ended', () => { stopPlayback(); state.time = 0; updatePlayer(); });
    audio.addEventListener('error', () => {
      if (!state.source) return;
      stopPlayback();
      if (status) status.textContent = 'This recording is unavailable. Choose another track or contact Momz14.';
    });
    window.addEventListener('pagehide', stopPlayback);

    const localAudio = (value) => {
      if (typeof value !== 'string' || !value.trim()) return '';
      try {
        const url = new URL(value, window.location.href);
        if (!['http:', 'https:', 'file:'].includes(url.protocol) || url.origin !== window.location.origin) return '';
        return /\.(mp3|wav)$/i.test(url.pathname) ? url.href : '';
      } catch { return ''; }
    };
    const setSource = (source) => {
      state.source = localAudio(source);
      if (state.source) audio.src = state.source;
      else { audio.removeAttribute('src'); audio.load(); }
      if (status) status.textContent = state.source ? 'Recording ready. Press play to listen.' : 'Ambient preview. Full recording is not available yet.';
    };
    catalog?.addEventListener('click', (event) => {
      const button = event.target.closest('.track-row-play-btn');
      const row = button?.closest('.music-track-row');
      if (!row) return;
      stopPlayback();
      state.time = 0;
      state.duration = Math.max(1, Number(row.dataset.trackDuration) || 214);
      setSource(row.dataset.audioSrc);
      if (title) title.textContent = row.dataset.trackTitle;
      if (description) description.textContent = row.querySelector('span')?.textContent || 'Original Momz14 composition.';
      if (meta) meta.textContent = 'Original composition · 2026';
      catalog.querySelectorAll('.music-track-row').forEach(item => item.classList.toggle('is-current', item === row));
      startPlayback();
    });
    const initialSource = catalog?.querySelector('.music-track-row')?.dataset.audioSrc
      || document.querySelector('.music-player-panel')?.dataset.audioSrc;
    if (initialSource) setSource(initialSource);
    updatePlayer();
  }

  const form = document.getElementById('momzContactForm');
  const success = document.getElementById('formSuccessAlert');
  const error = document.getElementById('formErrorAlert');
  let submitting = false;
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    error.className = success.className = 'form-feedback-alert';
    const fields = [...form.querySelectorAll('[required]')];
    const empty = fields.find(field => !field.value.trim());
    if (empty) {
      error.textContent = 'Please complete every required field.';
      error.className = 'form-feedback-alert error';
      empty.focus();
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    submitting = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(form.action, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const result = await response.json();
      const alert = response.ok && result.ok ? success : error;
      alert.textContent = result.message || 'Your message could not be sent. Please try again later.';
      alert.className = `form-feedback-alert ${alert === success ? 'success' : 'error'}`;
    } catch {
      error.textContent = 'Your message could not be sent. Please try again later.';
      error.className = 'form-feedback-alert error';
    } finally {
      submitting = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
});
