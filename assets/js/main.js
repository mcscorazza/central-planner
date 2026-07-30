// ==================================
// assets/js/main.js
// ==================================
import { supabaseClient } from './modules/supabase.js';
import { carregarBuJo, iniciarEventosBuJo } from './modules/bujo.js';
import { carregarProjetos, iniciarEventosProjetos } from './modules/projects.js';
import { carregarTimebox, iniciarEventosTimebox } from './modules/timebox.js';
import { carregarFinanceiro, iniciarEventosFinanceiro } from './modules/finance.js';
import { carregarHabitos, iniciarEventosHabitos } from './modules/habits.js';
import { carregarMetricas, iniciarEventosEnergia, iniciarEventosSono } from './modules/metrics.js';
import { carregarConsultas, iniciarEventosConsultas } from './modules/apointments.js';
import { carregarCursos, iniciarEventosCursos } from './modules/courses.js';

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
  carregarFinanceiro();
  carregarHabitos();
  carregarMetricas();
  carregarConsultas();
  carregarCursos();
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
iniciarEventosFinanceiro();
iniciarEventosHabitos();
iniciarEventosEnergia();
iniciarEventosSono();
iniciarEventosConsultas();
iniciarAcordeonsWidgets();
iniciarEventosCursos();


function iniciarAcordeonsWidgets() {
  const widgetsFechados = JSON.parse(localStorage.getItem('widgetsFechados')) || {};

  document.querySelectorAll('.widget.collapsible').forEach(widget => {
    const header = widget.querySelector('h3');
    const widgetId = widget.id;

    // Se estiver salvo como fechado, aplica a classe ao carregar
    if (widgetsFechados[widgetId]) {
      widget.classList.add('collapsed');
    }

    // Evento de clique no cabeçalho (h3) para abrir/fechar
    if (header) {
      header.addEventListener('click', () => {
        widget.classList.toggle('collapsed');

        // Atualiza o estado e salva localmente
        widgetsFechados[widgetId] = widget.classList.contains('collapsed');
        localStorage.setItem('widgetsFechados', JSON.stringify(widgetsFechados));
      });
    }
  });
}


verificarSessao();