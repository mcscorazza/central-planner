// --- ESTADO GLOBAL (LOCALSTORAGE) ---
// Puxa os dados salvos ou cria objetos vazios se for a primeira vez
let timeboxState = JSON.parse(localStorage.getItem('timeboxState')) || {};

function salvarTimebox() {
  localStorage.setItem('timeboxState', JSON.stringify(timeboxState));
}

function salvarBuJo() {
  const itens = [];
  document.querySelectorAll('.bujo-item').forEach(item => {
    const bullet = item.querySelector('.bujo-bullet');
    const texto = item.querySelector('.bujo-texto').innerText;
    itens.push({ texto: texto, estado: bullet.dataset.estado });
  });
  localStorage.setItem('bujoState', JSON.stringify(itens));
}

// --- LÓGICA DO SPOTLIGHT (Ctrl + K) ---
const spotlight = document.getElementById('spotlight-modal');
const spotlightInput = document.getElementById('spotlight-input');

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    spotlight.showModal();
  }
});

spotlight.addEventListener('click', (e) => {
  const dialogDimensions = spotlight.getBoundingClientRect()
  if (
    e.clientX < dialogDimensions.left ||
    e.clientX > dialogDimensions.right ||
    e.clientY < dialogDimensions.top ||
    e.clientY > dialogDimensions.bottom
  ) {
    spotlight.close();
  }
});

spotlightInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && spotlightInput.value.trim() !== '') {
    adicionarItemBuJo(spotlightInput.value.trim());
    spotlightInput.value = '';
    spotlight.close();
  }
});

// --- LÓGICA DO TIMEBOXING ---
const modal = document.getElementById('modal-tarefa');
const formTarefa = document.getElementById('form-tarefa');
const grade = document.getElementById('grade-horarios');

function inicializarGrade() {
  grade.innerHTML = '';
  for (let horaDec = 8; horaDec < 20; horaDec += 0.5) {
    const h = Math.floor(horaDec);
    const m = (horaDec % 1 === 0) ? '00' : '30';
    const horaFormatada = `${h.toString().padStart(2, '0')}:${m}`;
    const idOriginal = horaDec;

    const divLinha = document.createElement('div');
    divLinha.className = 'linha-tempo';
    divLinha.id = `linha-${idOriginal.toString().replace('.', '_')}`;

    const divBlock = document.createElement('div');
    divBlock.className = 'bloco-hora';
    divBlock.dataset.id = idOriginal;
    divBlock.id = `bloco-${idOriginal.toString().replace('.', '_')}`;

    divLinha.innerHTML = `<span class="hora-label">${horaFormatada}</span>`;

    divBlock.innerHTML = `
                    <span class="texto-tarefa" id="texto-${idOriginal.toString().replace('.', '_')}">Livre</span>
                `;

    divBlock.addEventListener('click', () => abrirModal(idOriginal, horaFormatada));
    divLinha.appendChild(divBlock);
    grade.appendChild(divLinha);
  }
}

function abrirModal(idOriginal, horaFormatada) {
  document.getElementById('input-hora-id').value = idOriginal;
  document.getElementById('modal-hora-display').innerText = horaFormatada;

  const textoAtual = document.getElementById(`texto-${idOriginal.toString().replace('.', '_')}`).innerText;
  document.getElementById('input-titulo').value = (textoAtual !== 'Livre') ? textoAtual : '';

  modal.showModal();
}

document.getElementById('btn-cancelar').addEventListener('click', () => modal.close());

// Função Limpar (Restaura os blocos escondidos)
document.getElementById('btn-limpar').addEventListener('click', () => {
  const idOriginal = parseFloat(document.getElementById('input-hora-id').value);
  const caixaIdStr = idOriginal.toString().replace('.', '_');
  const caixa = document.getElementById(`bloco-${caixaIdStr}`);

  const duracaoAntiga = parseInt(caixa.dataset.duracaoAtiva) || 1;

  // Restaura o bloco atual para visual vazio (tracejado)
  caixa.style.height = `var(--altura-bloco)`;
  caixa.style.backgroundColor = `var(--cor-vazio)`;
  caixa.style.border = "2px dashed rgba(255,255,255,0.1)";
  document.getElementById(`texto-${caixaIdStr}`).innerText = 'Livre';
  document.getElementById(`texto-${caixaIdStr}`).style.color = 'var(--text-muted)';
  caixa.dataset.duracaoAtiva = 1;

  // Mostra as linhas inteiras (hora + bloco) que estavam escondidas
  for (let i = 1; i < duracaoAntiga; i++) {
    const proxId = idOriginal + (i * 0.5);
    const proxLinha = document.getElementById(`linha-${proxId.toString().replace('.', '_')}`);
    if (proxLinha) proxLinha.style.display = 'flex';
  }

  // Remove do estado local e salva
  delete timeboxState[caixaIdStr];
  salvarTimebox();

  modal.close();
});

// Função separada para aplicar o visual do bloco (usada ao salvar e ao carregar a página)
function aplicarBlocoVisual(idStr, titulo, corSelecionada, duracao) {
  const idOriginal = parseFloat(idStr.replace('_', '.'));
  const caixa = document.getElementById(`bloco-${idStr}`);
  if (!caixa) return; // Evita erro se a hora não existir

  // Oculta as próximas *linhas inteiras* (Hora + Bloco)
  for (let i = 1; i < duracao; i++) {
    const proxId = idOriginal + (i * 0.5);
    const proxLinha = document.getElementById(`linha-${proxId.toString().replace('.', '_')}`);
    if (proxLinha) proxLinha.style.display = 'none';
  }

  const novaAltura = (44 * duracao) + (8 * (duracao - 1)); // 8px de gap
  caixa.style.height = `${novaAltura}px`;
  caixa.dataset.duracaoAtiva = duracao;

  // Aplica Cor Sólida no bloco agendado e texto branco
  document.getElementById(`texto-${idStr}`).innerText = titulo;
  document.getElementById(`texto-${idStr}`).style.color = '#ffffff';
  caixa.style.backgroundColor = `var(--${corSelecionada})`;
  caixa.style.border = "none";
}

// Salvar e Mesclar blocos
formTarefa.addEventListener('submit', (e) => {
  e.preventDefault();

  const idOriginal = parseFloat(document.getElementById('input-hora-id').value);
  const titulo = document.getElementById('input-titulo').value;
  const corSelecionada = document.getElementById('select-cor').value;
  const duracao = parseInt(document.getElementById('select-duracao').value);

  const caixaIdStr = idOriginal.toString().replace('.', '_');

  document.getElementById('btn-limpar').click();
  modal.showModal();

  aplicarBlocoVisual(caixaIdStr, titulo, corSelecionada, duracao);

  // Adiciona no estado local e salva
  timeboxState[caixaIdStr] = { titulo, corSelecionada, duracao };
  salvarTimebox();

  modal.close();
});

// --- LÓGICA DE LIMPAR O DIA INTEIRO ---
const modalConfirmacao = document.getElementById('modal-confirmacao');
const btnLimparDia = document.getElementById('btn-limpar-dia');

btnLimparDia.addEventListener('click', () => {
  // Só exibe o aviso se houver alguma tarefa agendada
  if (Object.keys(timeboxState).length > 0) {
    modalConfirmacao.showModal();
  }
});

document.getElementById('btn-cancelar-limpeza').addEventListener('click', () => {
  modalConfirmacao.close();
});

document.getElementById('btn-confirmar-limpeza').addEventListener('click', () => {
  timeboxState = {};
  salvarTimebox();
  inicializarGrade();
  modalConfirmacao.close();
});

// --- LÓGICA DO BULLET JOURNAL (BuJo) ---
const bujoList = document.getElementById('bujo-list');

function adicionarItemBuJo(texto, estado = 'pendente', aoCarregar = false) {
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

  const bullet = li.querySelector('.bujo-bullet');
  bullet.addEventListener('click', () => ciclarEstadoBuJo(li, bullet));

  const btnDeletar = li.querySelector('.bujo-deletar');
  btnDeletar.addEventListener('click', () => {
    li.remove();
    salvarBuJo();
  });

  if (aoCarregar) {
    bujoList.appendChild(li);
  } else {
    bujoList.prepend(li);
    salvarBuJo();
  }
}

function ciclarEstadoBuJo(item, bullet) {
  const estadoAtual = bullet.dataset.estado;

  if (estadoAtual === 'pendente') {
    bullet.dataset.estado = 'concluido';
    bullet.innerText = '✓';
    item.className = 'bujo-item concluido';
  } else if (estadoAtual === 'concluido') {
    bullet.dataset.estado = 'migrado';
    bullet.innerText = '>';
    item.className = 'bujo-item migrado';
  } else if (estadoAtual === 'migrado') {
    bullet.dataset.estado = 'nota';
    bullet.innerText = '-';
    item.className = 'bujo-item nota';
  } else {
    bullet.dataset.estado = 'pendente';
    bullet.innerText = '•';
    item.className = 'bujo-item pendente';
  }
  salvarBuJo(); // Atualiza o localStorage no clique
}

// --- INICIALIZAÇÃO DA TELA (LOADING) ---
inicializarGrade(); // 1. Monta a grade vazia de base

// 2. Carrega o BuJo salvo ou preenche com mock se for o primeiro acesso
const bujoSalvo = JSON.parse(localStorage.getItem('bujoState'));
if (bujoSalvo && bujoSalvo.length > 0) {
  bujoSalvo.forEach(item => {
    adicionarItemBuJo(item.texto, item.estado, true);
  });
} else {
  // Mock Inicial apenas para demonstração na 1ª vez
  adicionarItemBuJo('Revisar queries do PostgreSQL');
  adicionarItemBuJo('Planejar dashboard de Hábitos');
  setTimeout(() => {
    const bullet = bujoList.querySelector('.bujo-bullet');
    if (bullet) ciclarEstadoBuJo(bullet.parentElement, bullet);
  }, 500);
}

// 3. Pinta os blocos do Timeboxing por cima da grade gerada
for (const [idStr, dados] of Object.entries(timeboxState)) {
  aplicarBlocoVisual(idStr, dados.titulo, dados.corSelecionada, dados.duracao);
}

// --- LÓGICA DO TRACKER FINANCEIRO ---

// Tenta carregar do localStorage, se não existir, usa o mock padrão
let contas = JSON.parse(localStorage.getItem('bujo_contas')) || [
  { id: 1, nome: 'Energia Elétrica', vencimento: 'Hoje', valor: 185.50, pago: false },
  { id: 2, nome: 'Internet Fibra', vencimento: 'Amanhã', valor: 120.00, pago: false },
  { id: 3, nome: 'Cartão de Crédito', vencimento: 'Em 3 dias', valor: 850.00, pago: true }
];

function salvarContas() {
  localStorage.setItem('bujo_contas', JSON.stringify(contas));
}

function renderizarFinanceiro() {
  const lista = document.getElementById('lista-financeira');
  lista.innerHTML = '';
  let totalPendente = 0;

  // Ordena para que os pagos fiquem no final da lista
  const contasOrdenadas = [...contas].sort((a, b) => a.pago - b.pago);

  contasOrdenadas.forEach(conta => {
    const li = document.createElement('li');
    li.className = `fin-item ${conta.pago ? 'pago' : ''}`;

    li.innerHTML = `
                    <div class="fin-status" title="Clique para alterar o status"></div>
                    <div class="fin-detalhes">
                        <span class="fin-nome">${conta.nome}</span>
                        <span class="fin-vencimento">Vence: ${conta.vencimento}</span>
                    </div>
                    <span class="fin-valor">R$ ${conta.valor.toFixed(2).replace('.', ',')}</span>
                    <span class="fin-deletar" title="Excluir conta">✖</span>
                `;

    // Evento de clique na bolinha de status
    li.querySelector('.fin-status').addEventListener('click', () => {
      conta.pago = !conta.pago; // Inverte o status
      salvarContas(); // Salva no LocalStorage
      renderizarFinanceiro(); // Re-renderiza a lista
    });

    // Evento de clique para deletar
    li.querySelector('.fin-deletar').addEventListener('click', () => {
      contas = contas.filter(c => c.id !== conta.id);
      salvarContas();
      renderizarFinanceiro();
    });

    lista.appendChild(li);

    if (!conta.pago) {
      totalPendente += conta.valor;
    }
  });

  // Atualiza o total
  document.getElementById('fin-total').innerText = `R$ ${totalPendente.toFixed(2).replace('.', ',')}`;
  if (totalPendente === 0) {
    document.getElementById('fin-total').style.color = 'var(--cor-check)';
  } else {
    document.getElementById('fin-total').style.color = 'var(--cor-falha)';
  }
}

// --- CONTROLES DO MODAL FINANCEIRO ---
const modalFin = document.getElementById('modal-financeiro');
const btnNovaConta = document.getElementById('btn-nova-conta');
const formFin = document.getElementById('form-financeiro');
const btnCancelarFin = document.getElementById('btn-cancelar-fin');

btnNovaConta.addEventListener('click', () => {
  // Limpa o formulário antes de abrir
  document.getElementById('fin-input-nome').value = '';
  document.getElementById('fin-input-vencimento').value = '';
  document.getElementById('fin-input-valor').value = '';
  modalFin.showModal();
});

btnCancelarFin.addEventListener('click', () => {
  modalFin.close();
});

formFin.addEventListener('submit', () => {
  const nome = document.getElementById('fin-input-nome').value;
  const vencimento = document.getElementById('fin-input-vencimento').value;
  const valor = parseFloat(document.getElementById('fin-input-valor').value);

  const novaConta = {
    id: Date.now(), // Usa o timestamp como ID único
    nome: nome,
    vencimento: vencimento,
    valor: valor,
    pago: false
  };

  contas.push(novaConta);
  salvarContas();
  renderizarFinanceiro();
});

renderizarFinanceiro();

// --- LÓGICA DE COLAPSAR WIDGETS ---

// Recupera o estado salvo no navegador (quais estão abertos/fechados)
const widgetsFechados = JSON.parse(localStorage.getItem('widgetsFechados')) || {};

document.querySelectorAll('.widget.collapsible').forEach(widget => {
  const header = widget.querySelector('h3');
  const widgetId = widget.id;

  // Se estiver salvo como fechado no localStorage, já aplica a classe ao carregar
  if (widgetsFechados[widgetId]) {
    widget.classList.add('collapsed');
  }

  // Evento de clique para abrir/fechar
  header.addEventListener('click', () => {
    widget.classList.toggle('collapsed');

    // Atualiza o estado no objeto e salva no localStorage
    widgetsFechados[widgetId] = widget.classList.contains('collapsed');
    localStorage.setItem('widgetsFechados', JSON.stringify(widgetsFechados));
  });
});

// --- LÓGICA DE PROJETOS E TAREFAS ---

// Inicia com um mock ou carrega do LocalStorage
let projetos = JSON.parse(localStorage.getItem('projetosState')) || [
  {
    id: Date.now(),
    nome: "Dashboard Pessoal",
    aberto: true,
    tarefas: [
      { id: 101, desc: "Refatorar widget de Projetos", concluida: false },
      { id: 102, desc: "Criar modais de tarefas", concluida: true }
    ]
  }
];

function salvarProjetos() {
  localStorage.setItem('projetosState', JSON.stringify(projetos));
}

function renderizarProjetos() {
  const container = document.getElementById('lista-projetos-container');
  container.innerHTML = '';

  projetos.forEach(projeto => {
    const divItem = document.createElement('div');
    divItem.className = `projeto-item ${projeto.aberto ? '' : 'collapsed'}`;

    // Cabeçalho do Projeto
const divHeader = document.createElement('div');
    divHeader.className = 'projeto-header';
    divHeader.innerHTML = `
      <div class="projeto-titulo">${projeto.nome}</div>
      <div class="projeto-acoes">
        <button class="btn-add-tarefa" title="Adicionar Tarefa">+task</button>
        <span class="btn-deletar-projeto" title="Excluir Projeto">✖</span>
      </div>
    `;

    // Lógica do Acordeon (Exclusivo: abre um, fecha os outros)
    divHeader.querySelector('.projeto-titulo').addEventListener('click', () => {
      // Se clicou no que já tá aberto, só fecha. Se clicou em outro, fecha todos e abre ele.
      const estavaAberto = projeto.aberto;
      projetos.forEach(p => p.aberto = false); // Fecha todos
      if (!estavaAberto) projeto.aberto = true; // Abre o que foi clicado

      salvarProjetos();
      renderizarProjetos(); // Re-renderiza para aplicar animações
    });

    // Lógica de Abrir Modal de Tarefa
    divHeader.querySelector('.btn-add-tarefa').addEventListener('click', (e) => {
      e.stopPropagation(); // Evita que o clique acione o acordeon
      document.getElementById('input-id-projeto-tarefa').value = projeto.id;
      document.getElementById('input-desc-tarefa').value = '';
      document.getElementById('modal-nova-tarefa').showModal();
    });

    // === NOVA LÓGICA: DELETAR PROJETO ===
    divHeader.querySelector('.btn-deletar-projeto').addEventListener('click', (e) => {
      e.stopPropagation(); // Evita acionar o acordeon
      
      if (confirm(`Tem certeza que deseja excluir o projeto "${projeto.nome}" e todas as suas tarefas?`)) {
        projetos = projetos.filter(p => p.id !== projeto.id);
        salvarProjetos();
        renderizarProjetos();
      }
    });

    // Lista de Tarefas
    const ulTarefas = document.createElement('ul');
    ulTarefas.className = 'lista-tarefas';

    projeto.tarefas.forEach(tarefa => {
      const li = document.createElement('li');
      li.className = `tarefa-item ${tarefa.concluida ? 'concluida' : ''}`;

      li.innerHTML = `
        <input type="checkbox" class="tarefa-checkbox" ${tarefa.concluida ? 'checked' : ''}>
        <span>${tarefa.desc}</span>
      `;

      // Lógica do Checkbox da Tarefa
      li.querySelector('input').addEventListener('change', (e) => {
        tarefa.concluida = e.target.checked;
        salvarProjetos();
        renderizarProjetos();
      });

      ulTarefas.appendChild(li);
    });

    // Adiciona "Sem tarefas" se estiver vazio
    if (projeto.tarefas.length === 0) {
      ulTarefas.innerHTML = `<li class="tarefa-item" style="color: var(--text-muted); font-style: italic; justify-content: center;">Nenhuma tarefa pendente</li>`;
    }

    divItem.appendChild(divHeader);
    divItem.appendChild(ulTarefas);
    container.appendChild(divItem);
  });
}

// Controles do Modal de NOVO PROJETO
document.getElementById('btn-novo-projeto').addEventListener('click', () => {
  document.getElementById('input-nome-projeto').value = '';
  document.getElementById('modal-novo-projeto').showModal();
});

document.getElementById('btn-cancelar-projeto').addEventListener('click', () => {
  document.getElementById('modal-novo-projeto').close();
});

document.getElementById('form-novo-projeto').addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('input-nome-projeto').value;

  projetos.forEach(p => p.aberto = false); // Fecha os outros

  projetos.push({
    id: Date.now(),
    nome: nome,
    aberto: true, // Já cria e deixa aberto
    tarefas: []
  });

  salvarProjetos();
  renderizarProjetos();
  document.getElementById('modal-novo-projeto').close();
});

// Controles do Modal de NOVA TAREFA
document.getElementById('btn-cancelar-tarefa').addEventListener('click', () => {
  document.getElementById('modal-nova-tarefa').close();
});

document.getElementById('form-nova-tarefa').addEventListener('submit', (e) => {
  e.preventDefault();
  const idProj = parseInt(document.getElementById('input-id-projeto-tarefa').value);
  const desc = document.getElementById('input-desc-tarefa').value;

  const projeto = projetos.find(p => p.id === idProj);
  if (projeto) {
    projeto.tarefas.push({ id: Date.now(), desc: desc, concluida: false });
    projeto.aberto = true; // Garante que o projeto fique aberto pra ver a nova tarefa
    salvarProjetos();
    renderizarProjetos();
  }

  document.getElementById('modal-nova-tarefa').close();
});

// Renderiza tudo ao carregar a página
renderizarProjetos();

// --- LÓGICA DO TRACKER DE HÁBITOS ---

// Carrega os hábitos ou inicia com mocks
let habitos = JSON.parse(localStorage.getItem('habitosState')) || [
  { id: 1, nome: "💧 Beber 2L de Água", dias: [false, false, false, false, false, false, false] },
  { id: 2, nome: "🏋️ Exercício", dias: [false, false, false, false, false, false, false] }
];

const iniciaisDias = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

function salvarHabitos() {
  localStorage.setItem('habitosState', JSON.stringify(habitos));
}

function renderizarHabitos() {
  const container = document.getElementById('lista-habitos-container');
  container.innerHTML = '';

  habitos.forEach((habito, indexHabito) => {
    const divItem = document.createElement('div');
    divItem.className = 'habito-item';

    // Nome do hábito e botão de deletar
    const divInfo = document.createElement('div');
    divInfo.style.display = 'flex';
    divInfo.style.alignItems = 'center';
    divInfo.innerHTML = `
      <span class="habito-nome" title="${habito.nome}">${habito.nome}</span>
      <span class="habito-deletar" title="Excluir hábito">✖</span>
    `;

    // Deletar hábito
    divInfo.querySelector('.habito-deletar').addEventListener('click', () => {
      if (confirm(`Remover o hábito "${habito.nome}"?`)) {
        habitos.splice(indexHabito, 1);
        salvarHabitos();
        renderizarHabitos();
      }
    });

    // Grid de dias
    const divDias = document.createElement('div');
    divDias.className = 'habito-dias';

    habito.dias.forEach((concluido, indexDia) => {
      const divDia = document.createElement('div');
      divDia.className = `dia ${concluido ? 'concluido' : ''}`;
      divDia.innerText = iniciaisDias[indexDia];
      divDia.title = iniciaisDias[indexDia];

      // Alternar status do dia ao clicar
      divDia.addEventListener('click', () => {
        habito.dias[indexDia] = !habito.dias[indexDia];
        salvarHabitos();
        renderizarHabitos();
      });

      divDias.appendChild(divDia);
    });

    divItem.appendChild(divInfo);
    divItem.appendChild(divDias);
    container.appendChild(divItem);
  });
}

// Adicionar novo hábito
document.getElementById('btn-novo-habito').addEventListener('click', () => {
  const novoNome = prompt('Qual o nome do novo hábito?');
  if (novoNome && novoNome.trim() !== '') {
    habitos.push({
      id: Date.now(),
      nome: novoNome.trim(),
      dias: [false, false, false, false, false, false, false]
    });
    salvarHabitos();
    renderizarHabitos();
  }
});

// Renderiza ao iniciar
renderizarHabitos();

// Limpar a semana (Zerar todos os hábitos)
document.getElementById('btn-limpar-habitos').addEventListener('click', () => {
  if (habitos.length === 0) return;
  
  if (confirm('Tem certeza que deseja zerar todos os dias para iniciar uma nova semana?')) {
    habitos.forEach(habito => {
      habito.dias = [false, false, false, false, false, false, false];
    });
    
    salvarHabitos();
    renderizarHabitos();
  }
});

// ==========================================
// --- LÓGICA DE CONSULTAS E EXAMES ---
// ==========================================

let consultas = JSON.parse(localStorage.getItem('consultasState')) || [
  { id: 1, data: "12/08 - 14:00", desc: "Oftalmologista" },
  { id: 2, data: "20/08 - 08:00", desc: "Exames de Sangue" }
];

function salvarConsultas() {
  localStorage.setItem('consultasState', JSON.stringify(consultas));
}

function renderizarConsultas() {
  const lista = document.getElementById('lista-consultas');
  lista.innerHTML = '';

  consultas.forEach(consulta => {
    const li = document.createElement('li');
    li.className = 'consulta-item';
    
    li.innerHTML = `
      <div class="consulta-info">
        <span class="consulta-data">• ${consulta.data}</span>
        <span class="consulta-desc">${consulta.desc}</span>
      </div>
      <span class="consulta-deletar" title="Cancelar Agendamento">✖</span>
    `;

    // Deletar Consulta
    li.querySelector('.consulta-deletar').addEventListener('click', () => {
      if (confirm(`Deseja remover o agendamento: ${consulta.desc}?`)) {
        consultas = consultas.filter(c => c.id !== consulta.id);
        salvarConsultas();
        renderizarConsultas();
      }
    });

    lista.appendChild(li);
  });
  
  if (consultas.length === 0) {
    lista.innerHTML = `<li style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px 0;">Nenhuma consulta agendada</li>`;
  }
}

// Modal de Consultas
const modalConsulta = document.getElementById('modal-consulta');

document.getElementById('btn-nova-consulta').addEventListener('click', () => {
  document.getElementById('cons-input-data').value = '';
  document.getElementById('cons-input-desc').value = '';
  modalConsulta.showModal();
});

document.getElementById('btn-cancelar-cons').addEventListener('click', () => {
  modalConsulta.close();
});

document.getElementById('form-consulta').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = document.getElementById('cons-input-data').value;
  const desc = document.getElementById('cons-input-desc').value;
  
  consultas.push({ id: Date.now(), data, desc });
  salvarConsultas();
  renderizarConsultas();
  modalConsulta.close();
});

renderizarConsultas();


// ==========================================
// --- LÓGICA DO MONITOR DE ENERGIA ---
// ==========================================

const botoesEnergia = document.querySelectorAll('.btn-energia');
const textoStatus = document.getElementById('energia-status');

// Puxa o estado salvo ou deixa em branco
let energiaHoje = localStorage.getItem('energiaState') || null;

const mensagensEnergia = {
  baixa: "Pegue leve. Foque apenas no essencial hoje.",
  media: "Ritmo constante. Bom dia para tarefas moderadas.",
  alta: "No auge! Ideal para deep work e projetos complexos."
};

function aplicarEnergia(nivel) {
  // Limpa todos os botões
  botoesEnergia.forEach(btn => {
    btn.classList.remove('ativa-baixa', 'ativa-media', 'ativa-alta');
  });

  // Se tem um nível definido, aplica a classe visual e o texto correspondente
  if (nivel) {
    const btnAtivo = document.querySelector(`.btn-energia[data-nivel="${nivel}"]`);
    if (btnAtivo) {
      btnAtivo.classList.add(`ativa-${nivel}`);
      textoStatus.innerText = mensagensEnergia[nivel];
      textoStatus.style.color = "var(--text-main)";
    }
  }
}

// Evento de clique em cada botão
botoesEnergia.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const nivelSelecionado = e.currentTarget.dataset.nivel;
    
    // Salva no LocalStorage
    localStorage.setItem('energiaState', nivelSelecionado);
    
    // Aplica o visual
    aplicarEnergia(nivelSelecionado);
  });
});

// Inicializa a energia ao carregar a página
aplicarEnergia(energiaHoje);

// ==========================================
// --- LÓGICA DO MONITOR DE SONO ---
// ==========================================

const inputInicio = document.getElementById('sono-inicio');
const inputFim = document.getElementById('sono-fim');
const divResultado = document.getElementById('sono-resultado');
const btnSalvarSono = document.getElementById('btn-salvar-sono');

// Carrega o último registro ou inicia vazio
let sonoState = JSON.parse(localStorage.getItem('sonoState')) || { inicio: '', fim: '' };

function calcularDuracaoSono(inicio, fim) {
  if (!inicio || !fim) return null;

  // Separa horas e minutos e converte para números
  let [hInicio, mInicio] = inicio.split(':').map(Number);
  let [hFim, mFim] = fim.split(':').map(Number);

  let totalMinutosInicio = (hInicio * 60) + mInicio;
  let totalMinutosFim = (hFim * 60) + mFim;

  // Se a hora de acordar for menor que a de dormir, significa que virou o dia (passou da meia-noite)
  if (totalMinutosFim < totalMinutosInicio) {
    totalMinutosFim += 24 * 60; 
  }

  let diff = totalMinutosFim - totalMinutosInicio;
  let horas = Math.floor(diff / 60);
  let minutos = diff % 60;

  return { horas, minutos };
}

function renderizarSono() {
  inputInicio.value = sonoState.inicio;
  inputFim.value = sonoState.fim;

  const duracao = calcularDuracaoSono(sonoState.inicio, sonoState.fim);

  if (duracao) {
    // Define a cor baseada na quantidade de horas dormidas
    let cor = 'var(--cor-falha)'; // Menos de 5h (Vermelho)
    if (duracao.horas >= 7) cor = 'var(--cor-check)'; // 7h ou mais (Verde)
    else if (duracao.horas >= 5) cor = 'var(--cor-alerta)'; // 5h a 6h (Amarelo)

    divResultado.innerHTML = `
      Tempo total de descanso:
      <span class="sono-destaque" style="color: ${cor}">${duracao.horas}h ${duracao.minutos}m</span>
    `;
  } else {
    divResultado.innerHTML = `<span style="font-style: italic;">Insira os horários para calcular</span>`;
  }
}

// Salva e atualiza a interface ao clicar no botão
btnSalvarSono.addEventListener('click', () => {
  sonoState.inicio = inputInicio.value;
  sonoState.fim = inputFim.value;
  localStorage.setItem('sonoState', JSON.stringify(sonoState));
  renderizarSono();
});

// Renderiza ao iniciar a página
renderizarSono();