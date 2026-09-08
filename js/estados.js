import { renderizarTarefas } from "./renderizacao.js";

export function renderizarEstado(estado, dados) {
    const elStatus = document.querySelector("[data-estado]");
    const elQuadro = document.querySelector("[data-quadro]");

    if (!elStatus) return;

    switch (estado) {
        case "carregando":
            elStatus.textContent =
                "Carregando tarefas do servidor, por favor aguarde...";
            if (elQuadro) {
                renderizarTarefas([], elQuadro);
            }
            break;

        case "sucesso": {
            const tarefas = Array.isArray(dados) ? dados : [];
            elStatus.textContent = `Tarefas carregadas com sucesso. Total: ${tarefas.length} tarefa(s) encontrada(s).`;
            if (elQuadro) {
                renderizarTarefas(tarefas, elQuadro);
            }
            break;
        }

        case "vazio":
            elStatus.textContent =
                "Nenhuma tarefa cadastrada no sistema no momento.";
            if (elQuadro) {
                renderizarTarefas([], elQuadro);
            }
            break;

        case "erro": {
            let mensagem = "Ocorreu uma falha ao carregar as tarefas.";

            if (dados instanceof Error) {
                if (dados.name === "TypeError") {
                    mensagem =
                        "Erro de rede: Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
                } else if (dados.name === "SyntaxError") {
                    mensagem =
                        "Erro de formato: O documento de dados recebido é inválido (JSON malformatado).";
                } else if (dados.name === "HttpError" || dados.status) {
                    mensagem = `Erro de protocolo HTTP (${dados.status || "desconhecido"}): O recurso de dados não foi encontrado ou falhou.`;
                } else {
                    mensagem = `Erro: ${dados.message}`;
                }
            } else if (typeof dados === "string") {
                mensagem = dados;
            }

            // Preenche a mensagem de erro no elemento de status via textContent
            elStatus.textContent = mensagem;

            if (elQuadro) {
                renderizarTarefas([], elQuadro);
            }
            break;
        }

        default:
            console.warn(`Estado não reconhecido: ${estado}`);
    }
}
