import { renderizarTarefas } from "./renderizacao.js";

export function renderizarEstado(estado, tarefasVisiveis = []) {
    const elStatus = document.querySelector("[data-estado]");
    const elQuadro = document.querySelector("[data-quadro]");

    if (!elStatus) return;

    // 1. Estado de Carregamento
    if (estado.carregamento) {
        elStatus.textContent = "Carregando tarefas do servidor, por favor aguarde...";
        if (elQuadro) renderizarTarefas([], elQuadro);
        return;
    }

    // 2. Estado de Erro
    if (estado.erro) {
        let mensagem = "Ocorreu uma falha ao carregar as tarefas.";
        const erro = estado.erro;

        if (erro instanceof Error) {
            if (erro.name === "OfflineError" || erro.name === "NetworkError") {
                mensagem = "Erro de rede: Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
            } else if (erro.name === "SyntaxError") {
                mensagem = "Erro de formato: O documento de dados recebido é inválido (JSON malformatado).";
            } else if (erro.name === "HttpError" || erro.status) {
                mensagem = `Erro de protocolo HTTP (${erro.status || "desconhecido"}): O recurso de dados não foi encontrado ou falhou.`;
            } else {
                mensagem = `Erro: ${erro.message}`;
            }
        } else if (typeof erro === "string") {
            mensagem = erro;
        }

        elStatus.textContent = mensagem;
        if (elQuadro) renderizarTarefas([], elQuadro);
        return;
    }

    const totalOriginal = estado.tarefas.length;

    // 3. Origem de Dados Vazia
    if (totalOriginal === 0) {
        elStatus.textContent = "Nenhuma tarefa cadastrada no sistema no momento.";
        if (elQuadro) renderizarTarefas([], elQuadro);
        return;
    }

    // 4. Resultado Vazio pelos Filtros Aplicados
    if (tarefasVisiveis.length === 0) {
        elStatus.textContent = `Nenhum resultado encontrado para os filtros aplicados (0 de ${totalOriginal} tarefas).`;
        if (elQuadro) renderizarTarefas([], elQuadro);
        return;
    }

    // 5. Sucesso com Exibição de Resultados
    elStatus.textContent = `Exibindo ${tarefasVisiveis.length} de ${totalOriginal} tarefa(s).`;
    if (elQuadro) renderizarTarefas(tarefasVisiveis, elQuadro);
}