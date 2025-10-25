const USERS = [
  { username: 'admin', password: 'admin123' },
  { username: 'user',  password: 'user123' }
];

//Credentials Verification
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('#login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const u = loginForm.querySelector('input[name="username"]').value.trim();
    const p = loginForm.querySelector('input[name="password"]').value;

    const ok = USERS.some(x => x.username === u && x.password === p);
    
    if (ok) {
      localStorage.setItem('username',u);
      window.location.href = 'pokemon.html';
    } else {
      alert('Credenciales incorrectas');
    }
    

  });
});