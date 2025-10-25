const API_BASE = 'https://pokeapi.co/api/v2';
const INITIAL_LIMIT = 30;
const BACKEND_BASE = '/api';

const $ = id => document.getElementById(id);
const grid = $('grid');
const query = $('query');
const btnSearch = $('btnSearch');
const btnLogout = $('btnLogout');

const loggedUser = localStorage.getItem('username') || null;
const cache = new Map(); // id -> details
let favorites = new Set();

// util fetch
async function fetchJson(url, opts){
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

function makeCardBrief(item){
  const d = document.createElement('div');
  d.className = 'card';
  d.dataset.id = item.id;
  d.innerHTML = `
    <img loading="lazy" src="${item.image}" alt="${item.name}">
    <div class="name">${item.name}</div>
    <button class="details-btn ability-btn">Details</button>
    <span class="heart material-icons ${favorites.has(Number(item.id)) ? 'red-color' : ''}" title="Favorito">favorite</span>
    <div class="details" style="display:none"></div>
  `;
  return d;
}

// render lista rápida
function renderList(items){
  grid.innerHTML = '';
  const f = document.createDocumentFragment();
  items.forEach(it => f.appendChild(makeCardBrief(it)));
  grid.appendChild(f);
}

function refreshHearts(){
  grid.querySelectorAll('.card').forEach(card => {
    const id = Number(card.dataset.id);
    const btn = card.querySelector('.heart');
    if (!btn) return;
    if (favorites.has(id)) btn.classList.add('red-color');
    else btn.classList.remove('red-color');
  });
}

async function loadInitial(){
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px">Cargando...</div>';
  try{
    const data = await fetchJson(`${API_BASE}/pokemon?limit=${INITIAL_LIMIT}`);
    const items = data.results.map(r => {
      const parts = r.url.split('/').filter(Boolean);
      const id = parts[parts.length-1];
      const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
      return { id: Number(id), name: r.name, image: img, url: r.url };
    });
    renderList(items);
    await loadFavoritesFromServer();
  }catch(e){
    grid.innerHTML = `<div style="grid-column:1/-1;color:#c23b3b;padding:20px">Error cargando pokemons</div>`;
    console.error(e);
  }
}

async function searchByName(name){
  if (!name) return loadInitial();
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px">Buscando...</div>';
  try{
    const p = await fetchJson(`${API_BASE}/pokemon/${name.toLowerCase()}`);
    cache.set(p.id, p);

    renderList([{ id:p.id, name:p.name, image: p.sprites?.other?.['official-artwork']?.front_default || p.sprites?.front_default }]);
    await loadFavoritesFromServer();

    const card = grid.querySelector('.card');
    if (card) {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'flex-start';
      wrapper.style.gap = '12px';

      card.style.margin = '0'; 
      wrapper.appendChild(card);

      const backBtn = document.createElement('button');
      backBtn.className = 'back-btn';
      backBtn.type = 'button';
      backBtn.textContent = 'Volver';
      backBtn.addEventListener('click', () => {
        loadInitial();
      });

      wrapper.appendChild(backBtn);

      // limpiar grid y poner el wrapper ocupando toda la fila
      grid.innerHTML = '';
      const container = document.createElement('div');
      container.style.gridColumn = '1/-1';
      container.appendChild(wrapper);
      grid.appendChild(container);
      refreshHearts();
    }

  }catch(e){
    grid.innerHTML = `<div style="grid-column:1/-1;color:#c23b3b;padding:20px">No se encontró "${name}".</div>`;
  }
}

async function showDetails(card){
  const id = Number(card.dataset.id);
  let p = cache.get(id);
  if (!p){
    try { p = await fetchJson(`${API_BASE}/pokemon/${id}`); cache.set(id,p); }
    catch { alert('No se pudo cargar detalles'); return; }
  }
  const detailsBox = card.querySelector('.details');
  detailsBox.style.display = 'block';

  const abilities = (p.abilities||[]).map(a => `${a.ability.name}${a.is_hidden? ' (hidden)':''}`).join(', ') || '—';
  const stats = (p.stats||[]).map(s=>`${s.stat.name}:${s.base_stat}`).join(' • ') || '—';
  const moves = (p.moves||[]).slice(0,4).map(m=>m.move.name).join(', ') || '—';
  detailsBox.innerHTML = `
    <div class="meta">h:${p.height} • w:${p.weight} • exp:${p.base_experience||0}</div>
    <div><strong>Abilities:</strong> ${abilities}</div>
    <div><strong>Stats:</strong> ${stats}</div>
    <div><strong>Moves:</strong> ${moves}</div>
  `;
}

// backend favorites
async function loadFavoritesFromServer(){
  if (!loggedUser) return;
  try{
    const data = await fetchJson(`${BACKEND_BASE}/favorites?user=${encodeURIComponent(loggedUser)}`);
    favorites = new Set(data.map(x => Number(x.pokemon_id)));
    refreshHearts();
  }catch(e){ console.warn('fav load', e.message); }
}

async function addFavorite(p){
  if (!loggedUser){ alert('Debes iniciar sesión'); return; }
  try{
    await fetch(`${BACKEND_BASE}/favorites`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user: loggedUser, pokemon_id: p.id, pokemon_name: p.name, pokemon_data: p }) });
    favorites.add(p.id);
    refreshHearts();
  }catch(e){ alert('Error guardando favorito'); console.error(e); }
}

async function removeFavorite(id){
  if (!loggedUser){ alert('Debes iniciar sesión'); return; }
  try{
    await fetch(`${BACKEND_BASE}/favorites`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user: loggedUser, pokemon_id: id }) });
    favorites.delete(id);
    refreshHearts();
  }catch(e){ alert('Error borrando favorito'); console.error(e); }
}

grid.addEventListener('click', async e => {
  const card = e.target.closest('.card');
  if (!card) return;

  if (e.target.classList.contains('details-btn')){
    // toggle details
    const d = card.querySelector('.details');
    if (d.style.display === 'block'){ d.style.display = 'none'; return; }
    await showDetails(card);
    return;
  }

  // toggle favorito
  if (e.target.classList.contains('heart')) {
    const id = Number(card.dataset.id);

    // si ya es favorito -> eliminar
    if (favorites.has(id)) {
      favorites.delete(id);
      e.target.classList.remove('red-color');

      try {
        await removeFavorite(id); // tu función que hace DELETE al backend
      } catch (err) {
        // revertir si falla
        favorites.add(id);
        e.target.classList.add('red-color');
        alert('Error borrando favorito');
        console.error(err);
      }
      return;
    }

    // no es favorito -> agregar
    favorites.add(id);
    e.target.classList.add('red-color');

    try {
      // consigue el objeto pokemon para enviar al backend
      let p = cache.get(id);
      if (!p) {
        p = await fetchJson(`${API_BASE}/pokemon/${id}`);
        cache.set(id, p);
      }
      await addFavorite(p); // tu función que hace POST al backend
    } catch (err) {
      // revertir si falla
      favorites.delete(id);
      e.target.classList.remove('red-color');
      alert('Error guardando favorito');
      console.error(err);
    }
    return;
  }
});

btnSearch.addEventListener('click', ()=> searchByName(query.value.trim()));
query.addEventListener('keydown', e => { if (e.key === 'Enter') searchByName(query.value.trim()); });
btnLogout.addEventListener('click', ()=> { localStorage.removeItem('username'); location.href='index.html'; });

// init
document.addEventListener('DOMContentLoaded', () => loadInitial());