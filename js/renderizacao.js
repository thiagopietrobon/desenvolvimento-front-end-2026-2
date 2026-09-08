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