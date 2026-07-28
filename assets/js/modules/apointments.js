// =====================================
// assets/js/modules/apointments.js
// =====================================

import { supabaseClient } from './supabase.js';

let consultas = [];

export async function carregarConsultas() {
  const { data, error } = await supabaseClient
    .from('dash_consultas')
    .select('*')
    .order('created_at', { ascending: true });

  if (!error) {
    consultas = data;
    renderizarConsultas();
  }
}

function renderizarConsultas() {
  const lista = document.getElementById('lista-consultas');
  if (!lista) return;
  
  lista.innerHTML = '';

  consultas.forEach((consulta) => {
    const li = document.createElement('li');
    li.className = 'consulta-item';

    // Usamos data_marcada e titulo (que vêm do Supabase) mantendo as suas classes CSS
    li.innerHTML = `
      <div class="consulta-info">
        <span class="consulta-data">${consulta.data_marcada}</span>
        <span class="consulta-desc">${consulta.titulo}</span>
      </div>
      <span class="consulta-deletar" title="Cancelar Agendamento">✖</span>
    `;

    // Evento: Deletar Consulta (Agora assíncrono com o Supabase)
    li.querySelector('.consulta-deletar').addEventListener('click', async () => {
      if (confirm(`Deseja remover o agendamento: ${consulta.titulo}?`)) {
        const idDaConsulta = consulta.id;
        
        // Remove da lista local e atualiza a tela instantaneamente
        consultas = consultas.filter(c => c.id !== idDaConsulta);
        renderizarConsultas();

        // Deleta no banco de dados em background
        await supabaseClient
          .from('dash_consultas')
          .delete()
          .eq('id', idDaConsulta);
      }
    });

    lista.appendChild(li);
  });

  // Mantive a sua estilização exata de quando a lista está vazia
  if (consultas.length === 0) {
    lista.innerHTML = `<li style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px 0;">Nenhuma consulta agendada</li>`;
  }
}

export function iniciarEventosConsultas() {
  const modalConsulta = document.getElementById('modal-consulta');
  const formConsulta = document.getElementById('form-consulta');
  const btnCancelarCons = document.getElementById('btn-cancelar-cons');

  // O botão que fica na interface para abrir o modal (ajuste o ID se necessário)
  const btnNovaConsulta = document.getElementById('btn-nova-consulta');

  // 1. Abrir Modal
  if (btnNovaConsulta) {
    btnNovaConsulta.addEventListener('click', () => {
      // Limpa os campos antes de abrir
      document.getElementById('cons-input-data').value = '';
      document.getElementById('cons-input-desc').value = '';
      modalConsulta.showModal();
    });
  }

  // 2. Cancelar / Fechar Modal
  if (btnCancelarCons) {
    btnCancelarCons.addEventListener('click', () => {
      modalConsulta.close();
    });
  }

  // 3. Salvar (Interceptar o formulário)
  if (formConsulta) {
    formConsulta.addEventListener('submit', async (e) => {
      e.preventDefault(); 
      
      const dataMarcada = document.getElementById('cons-input-data').value;
      const titulo = document.getElementById('cons-input-desc').value;

      modalConsulta.close();

      // CORREÇÃO AQUI: Especificamos explicitamente a coluna "data_marcada" recebendo a variável "dataMarcada"
      const { data, error } = await supabaseClient
        .from('dash_consultas')
        .insert([{ 
          titulo: titulo, 
          data_marcada: dataMarcada, 
          realizado: false 
        }])
        .select();

      if (!error && data) {
        consultas.push(data[0]); 
        renderizarConsultas();   
      } else {
        console.error("Erro ao salvar a consulta:", error);
      }
    });
  }
}