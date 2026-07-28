// ==================================
// assets/js/main.js
// ==================================
import { supabaseClient } from './modules/supabase.js';
import { carregarBuJo, iniciarEventosBuJo } from './modules/bujo.js';
import { carregarProjetos, iniciarEventosProjetos } from './modules/projects.js';
import { carregarTimebox, iniciarEventosTimebox } from './modules/timebox.js';

const telaLogin = document.getElementById('tela-login');
const dashboardApp = document.getElementById('dashboard-app');
const formLogin = document.getElementById('form-login');

async function verificarSessao() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    mostrarDashboard();
  } else {
    mostrarLogin();
  }
}

function mostrarDashboard() {
  telaLogin.classList.add('hidden');
  dashboardApp.classList.remove('hidden');
  carregarBuJo();
  carregarProjetos();
  carregarTimebox();
}

function mostrarLogin() {
  dashboardApp.classList.add('hidden');
  telaLogin.classList.remove('hidden');
}

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-senha').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  
  if (!error) mostrarDashboard();
});

iniciarEventosBuJo();
iniciarEventosProjetos();
iniciarEventosTimebox();
verificarSessao();