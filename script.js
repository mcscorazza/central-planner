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

// Permite fechar o spotlight apertando ESC 
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
    // Ao dar enter, adiciona direto no Bullet Journal
    adicionarItemBuJo(spotlightInput.value.trim());
    spotlightInput.value = '';
    spotlight.close();
  }
});

// --- LÓGICA DO TIMEBOXING ---
const modal = document.getElementById('modal-tarefa');
const formTarefa = document.getElementById('form-tarefa');
const grade = document.getElementById('grade-horarios');

// Varrer das 08:00 até as 19:30 (passos de 0.5 = 30 min)
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
  timeboxState = {}; // Zera o estado na memória
  salvarTimebox();   // Atualiza o localStorage apagando tudo
  inicializarGrade(); // Refaz a grade de horários limpa na tela
  modalConfirmacao.close();
});

// --- LÓGICA DO BULLET JOURNAL (BuJo) ---
const bujoList = document.getElementById('bujo-list');

// Adicionado o parametro 'aoCarregar' para não re-salvar os itens na hora de ler o banco
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

  /* Lógica para excluir o item do BuJo */
  const btnDeletar = li.querySelector('.bujo-deletar');
  btnDeletar.addEventListener('click', () => {
    li.remove(); // Remove do HTML
    salvarBuJo(); // Pede pro banco atualizar a lista sem esse item
  });

  if (aoCarregar) {
    bujoList.appendChild(li); // Mantém a ordem salva na leitura
  } else {
    bujoList.prepend(li); // Novas tarefas via Spotlight entram no topo
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
    document.getElementById('fin-total').style.color = 'var(--cor-dev)';
  } else {
    document.getElementById('fin-total').style.color = 'var(--cor-saude)';
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