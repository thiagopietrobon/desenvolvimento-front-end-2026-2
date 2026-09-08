// Cria os cartões
export function criarCartao(tarefa) {
    const cartao = document.createElement("article");
    cartao.className = "cartao";
    cartao.dataset.tarefaId = tarefa.id;

    const titulo = document.createElement("h4");
    titulo.textContent = tarefa.titulo;

    const pProjeto = document.createElement("p");
    const strongProjeto = document.createElement("strong");
    strongProjeto.textContent = "Projeto: ";
    pProjeto.append(strongProjeto, tarefa.projeto || "Geral");

    const pResponsavel = document.createElement("p");
    const strongResp = document.createElement("strong");
    strongResp.textContent = "Responsável: ";
    pResponsavel.append(strongResp, tarefa.responsavel || "Não atribuído");

    const pPrioridade = document.createElement("p");
    const strongPrio = document.createElement("strong");
    strongPrio.textContent = "Prioridade: ";
    pPrioridade.append(strongPrio, tarefa.prioridade);

    const pPrazo = document.createElement("p");
    const strongPrazo = document.createElement("strong");
    strongPrazo.textContent = "Prazo: ";
    pPrazo.append(strongPrazo, tarefa.prazo);

    const botaoDetalhes = document.createElement("button");
    botaoDetalhes.type = "button";
    botaoDetalhes.dataset.acao = "ver-detalhes";

    const spanBotao = document.createElement("span");
    spanBotao.textContent = "Ver Detalhes";
    botaoDetalhes.append(spanBotao);

    cartao.append(
        titulo,
        pProjeto,
        pResponsavel,
        pPrioridade,
        pPrazo,
        botaoDetalhes,
    );
    return cartao;
}

//Filtra e distribui as tarefas nas listas de cada coluna do quadro.
export function renderizarTarefas(tarefas, quadro) {
    if (!quadro) return;

    const listas = quadro.querySelectorAll("[data-lista-status]");

    listas.forEach((lista) => {
        const statusColuna = lista.dataset.listaStatus;
        const tarefasColuna = tarefas.filter((t) => t.status === statusColuna);

        if (tarefasColuna.length === 0) {
            const itemVazio = document.createElement("li");
            itemVazio.className = "coluna-vazia";
            itemVazio.textContent = "Nenhuma tarefa nesta coluna.";
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

//Instala um listener de evento delegado no quadro para os botões de detalhes.
export function instalarEventosDoQuadro(quadro, obterTarefas) {
    if (!quadro) return;

    quadro.addEventListener("click", (evento) => {
        if (!(evento.target instanceof Element)) return;

        const botao = evento.target.closest('button[data-acao="ver-detalhes"]');
        if (!botao || !quadro.contains(botao)) return;

        const cartao = botao.closest("[data-tarefa-id]");
        if (!cartao) return;

        const id = cartao.dataset.tarefaId;
        const tarefas =
            typeof obterTarefas === "function" ? obterTarefas() : obterTarefas;
        const tarefa = Array.isArray(tarefas)
            ? tarefas.find((item) => item.id === id)
            : null;

        if (!tarefa) return;
        console.log("Detalhes da tarefa:", tarefa);
    });
}
