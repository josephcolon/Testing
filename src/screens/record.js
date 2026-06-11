/* ==========================================================================
   record.js — parent records the game's voice in their own voice.

   The parent records a small vocabulary (~40 short clips). The game stitches
   them into every prompt. Recording uses MediaRecorder + getUserMedia; clips
   are saved as Blobs in IndexedDB (see voice.js). If the device can't record,
   the screen explains and the game keeps using speech synthesis.
   ========================================================================== */

import {
  VOCAB_GROUPS, ALL_VOCAB, saveClip, getClip, deleteClip,
  refreshRecorded, isRecorded, recordedCount, stopVoice, requestPersistence,
} from '../voice.js';

export function renderRecord({ root, show }) {
  requestPersistence(); // keep recordings durable across sessions
  let stream = null;
  let recorder = null;
  let activeToken = null;
  let chunks = [];

  draw();

  async function draw() {
    await refreshRecorded();
    const total = ALL_VOCAB.length;
    root.innerHTML = `
      <div class="screen" style="justify-content:flex-start;overflow:auto;padding-top:calc(var(--gap)*2)">
        <button class="iconbtn back-btn" id="back">⬅️</button>
        <h1 class="title" style="font-size:clamp(1.5rem,5.5vmin,2.6rem)">🎙️ Record Your Voice</h1>
        <p class="subtitle" style="max-width:46ch">
          Tap <b>●</b> and say each word, then tap <b>■</b> to stop. Record a few or
          all — every word you record shows up in your voice <b>everywhere you play</b>,
          and it's saved on this device. <b>${recordedCount()}/${total}</b> recorded.
        </p>
        <div id="micnote" class="subtitle" hidden></div>
        <div class="settings-list">
          ${VOCAB_GROUPS.map(groupHTML).join('')}
        </div>
      </div>
    `;
    wire();
  }

  function groupHTML(g) {
    return `
      <div class="rec-group">
        <div class="rec-group-title">${g.title}</div>
        ${g.items.map(itemHTML).join('')}
      </div>`;
  }

  function itemHTML(item) {
    const done = isRecorded(item.token);
    return `
      <div class="rec-row ${done ? 'done' : ''}" data-token="${item.token}">
        <div class="rec-word">${done ? '✅' : '⬜'} <b>${item.label}</b></div>
        <div class="rec-actions">
          <button class="iconbtn rec-btn" title="Record">●</button>
          <button class="iconbtn play-btn" title="Play" ${done ? '' : 'disabled'}>▶️</button>
          <button class="iconbtn del-btn" title="Delete" ${done ? '' : 'disabled'}>🗑️</button>
        </div>
      </div>`;
  }

  async function ensureMic() {
    if (stream) return stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch {
      const note = root.querySelector('#micnote');
      if (note) {
        note.hidden = false;
        note.innerHTML = '⚠️ Microphone not available. Allow mic access in your browser, ' +
          'or the game will keep using its built-in voice.';
      }
      return null;
    }
  }

  function setRowState(token, state) {
    const row = root.querySelector(`.rec-row[data-token="${token}"]`);
    if (!row) return;
    const recBtn = row.querySelector('.rec-btn');
    row.classList.toggle('recording', state === 'recording');
    recBtn.textContent = state === 'recording' ? '■' : '●';
  }

  async function startRecording(token) {
    const s = await ensureMic();
    if (!s) return;
    if (!('MediaRecorder' in window)) { await ensureMic(); return; }
    stopVoice();
    chunks = [];
    activeToken = token;
    try {
      recorder = new MediaRecorder(s);
    } catch {
      return;
    }
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
      if (blob.size) {
        await saveClip(token, blob);
        await refreshRecorded();
      }
      setRowState(token, 'idle');
      activeToken = null;
      // Refresh just this row's controls.
      const row = root.querySelector(`.rec-row[data-token="${token}"]`);
      if (row) {
        row.classList.add('done');
        row.querySelector('.rec-word').innerHTML = `✅ <b>${labelFor(token)}</b>`;
        row.querySelector('.play-btn').disabled = false;
        row.querySelector('.del-btn').disabled = false;
        updateCounter();
      }
    };
    recorder.start();
    setRowState(token, 'recording');
  }

  function stopRecording() {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  function updateCounter() {
    const note = root.querySelector('.subtitle b');
    if (note) note.textContent = `${recordedCount()}/${ALL_VOCAB.length}`;
  }

  const labelFor = (t) => ALL_VOCAB.find((v) => v.token === t)?.label || t;

  async function playToken(token) {
    const blob = await getClip(token);
    if (!blob) return;
    stopVoice();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play().catch(() => URL.revokeObjectURL(url));
  }

  function wire() {
    root.querySelector('#back').addEventListener('click', () => {
      stopRecording();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      show('home');
    });

    root.querySelectorAll('.rec-row').forEach((row) => {
      const token = row.dataset.token;
      row.querySelector('.rec-btn').addEventListener('click', () => {
        if (activeToken === token && recorder && recorder.state === 'recording') {
          stopRecording();
        } else {
          if (activeToken) stopRecording();
          startRecording(token);
        }
      });
      row.querySelector('.play-btn').addEventListener('click', () => playToken(token));
      row.querySelector('.del-btn').addEventListener('click', async () => {
        await deleteClip(token);
        await refreshRecorded();
        draw();
      });
    });
  }
}
