const ROTULOS_STATUS = {
    "a-fazer": "A Fazer",
    "em-andamento": "Em Andamento",
    "em-revisao": "Em Revisão",
    "concluida": "Concluída",
};

function criarLinhaMeta(rotulo, valor, classe = "") {
    const linha = document.createElement("p");
    if (classe) linha.className = classe;
    const rotuloEl = document.createElement("strong");
    rotuloEl.textContent = `${rotulo}: `;
    const valorEl = document.createElement("span");
    valorEl.textContent = valor;
    linha.append(rotuloEl, valorEl);
    return linha;
}

// Cria a estrutura visual do cartão sem modificar os dados da tarefa.
export function criarCartao(tarefa) {
    const cartao = document.createElement("article");
    cartao.className = `cartao cartao--${tarefa.status}`;
    cartao.dataset.tarefaId = tarefa.id;

    const topo = document.createElement("div");
    topo.className = "cartao-topo";
    const status = document.createElement("span");
    status.className = `badge-status badge-status--${tarefa.status}`;
    status.textContent = ROTULOS_STATUS[tarefa.status] || tarefa.status;
    topo.append(status);

    const titulo = document.createElement("h4");
    titulo.textContent = tarefa.titulo;

    const prioridade = document.createElement("span");
    const prioridadeClasse = String(tarefa.prioridade || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    prioridade.className = `badge-prioridade badge-prioridade--${prioridadeClasse}`;
    prioridade.textContent = `⚑ ${tarefa.prioridade || "Sem prioridade"}`;

    const prazo = document.createElement("p");
    prazo.className = "cartao-prazo";
    const prazoLabel = document.createElement("strong");
    prazoLabel.textContent = "▦ Prazo: ";
    const prazoValor = document.createElement("span");
    prazoValor.textContent = tarefa.prazo || "Não definido";
    prazo.append(prazoLabel, prazoValor);

    const botaoDetalhes = document.createElement("button");
    botaoDetalhes.type = "button";
    botaoDetalhes.dataset.acao = "ver-detalhes";
    botaoDetalhes.textContent = "Ver detalhes →";

    cartao.append(
        topo,
        titulo,
        criarLinhaMeta("Projeto", tarefa.projeto || "Geral"),
        criarLinhaMeta("Responsável", tarefa.responsavel || "Não atribuído"),
        prioridade,
        prazo,
        botaoDetalhes,
    );
    return cartao;
}

// Atualiza os cartões e a contagem de cada etapa do quadro.
export function renderizarTarefas(tarefas, quadro) {
    if (!quadro) return;

    const listas = quadro.querySelectorAll("[data-lista-status]");
    listas.forEach((lista) => {
        const statusColuna = lista.dataset.listaStatus;
        const tarefasColuna = tarefas.filter((t) => t.status === statusColuna);
        const secao = lista.closest('section[aria-labelledby^="quadro-"]');
        const titulo = secao?.querySelector("h3");

        if (titulo) {
            let contador = titulo.querySelector(".contador-coluna");
            if (!contador) {
                contador = document.createElement("span");
                contador.className = "contador-coluna";
                contador.setAttribute("aria-label", "Quantidade de tarefas");
                titulo.append(contador);
            }
            contador.textContent = String(tarefasColuna.length);
        }

        if (tarefasColuna.length === 0) {
            const itemVazio = document.createElement("li");
            itemVazio.className = "coluna-vazia";
            itemVazio.textContent = "✨ Tudo tranquilo por aqui";
            lista.replaceChildren(itemVazio);
        } else {
            const cartoes = tarefasColuna.map((t) => {
                const li = document.createElement("li");
                li.append(criarCartao(t));
                return li;
            });
            lista.replaceChildren(...cartoes);
        }
    });
}

// Ouvinte delegado para abrir os detalhes da tarefa selecionada.
export function instalarEventosDoQuadro(quadro, obterTarefas) {
    if (!quadro) return;

    quadro.addEventListener("click", (evento) => {
        if (!(evento.target instanceof Element)) return;

        const botao = evento.target.closest('button[data-acao="ver-detalhes"]');
        if (!botao || !quadro.contains(botao)) return;

        const cartao = botao.closest("[data-tarefa-id]");
        if (!cartao) return;

        const id = cartao.dataset.tarefaId;
        const tarefas = typeof obterTarefas === "function" ? obterTarefas() : obterTarefas;
        const tarefa = Array.isArray(tarefas)
            ? tarefas.find((item) => item.id === id)
            : null;

        if (!tarefa) return;
        console.log("Detalhes da tarefa:", tarefa);
    });
}
