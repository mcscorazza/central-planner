// =======================================
// assets/js/modules/bujo.js
// =======================================

import { supabaseClient } from './supabase.js';

const bujoList = document.getElementById('bujo-list');

// Exportamos essa função para que o main.js possa chamá-la após o login
export async function carregarBuJo() {
    const { data, error } = await supabaseClient
        .from('bujo_items')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error(error);
    bujoList.innerHTML = '';
    data.forEach(item => renderizarItemBuJo(item.id, item.texto, item.estado));
}

async function adicionarItemBuJo(texto) {
    const { data, error } = await supabaseClient
        .from('bujo_items')
        .insert([{ texto, estado: 'pendente' }])
        .select();
    if (error) return console.error(error);
    renderizarItemBuJo(data[0].id, data[0].texto, data[0].estado, true);
}

function renderizarItemBuJo(id, texto, estado, noTopo = false) {
    const li = document.createElement('li');
    li.className = `bujo-item ${estado}`;

    let char = '•';
    if (estado === 'concluido') char = '✓';
    if (estado === 'migrado') char = '>';
    if (estado === 'nota') char = '-';

    li.innerHTML = `
    <span class="bujo-bullet" data-estado="${estado}">${char}</span>
    <span class="bujo-texto">${texto}</span>
    <span class="bujo-deletar" title="Excluir tarefa">✖</span>
  `;

    // --- Evento: Mudar Estado (Update) ---
    const bullet = li.querySelector('.bujo-bullet');
    bullet.addEventListener('click', async () => {
        const estadoAtual = bullet.dataset.estado;
        let novoEstado = 'pendente';
        let novoChar = '•';

        if (estadoAtual === 'pendente') { novoEstado = 'concluido'; novoChar = '✓'; }
        else if (estadoAtual === 'concluido') { novoEstado = 'migrado'; novoChar = '>'; }
        else if (estadoAtual === 'migrado') { novoEstado = 'nota'; novoChar = '-'; }

        bullet.dataset.estado = novoEstado;
        bullet.innerText = novoChar;
        li.className = `bujo-item ${novoEstado}`;

        await supabaseClient
            .from('bujo_items')
            .update({ estado: novoEstado })
            .eq('id', id);
    });

    // --- Evento: Deletar (Delete) ---
    const btnDeletar = li.querySelector('.bujo-deletar');
    btnDeletar.addEventListener('click', async () => {
        li.remove();
        await supabaseClient
            .from('bujo_items')
            .delete()
            .eq('id', id);
    });

    if (noTopo) {
        bujoList.prepend(li);
    } else {
        bujoList.appendChild(li);
    }
}

// Inicializa os atalhos exclusivos do BuJo (Ctrl+K)
export function iniciarEventosBuJo() {
    const spotlightInput = document.getElementById('spotlight-input');
    const spotlight = document.getElementById('spotlight-modal');

    spotlightInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && spotlightInput.value.trim() !== '') {
            adicionarItemBuJo(spotlightInput.value.trim());
            spotlightInput.value = '';
            spotlight.close();
        }
    });
}