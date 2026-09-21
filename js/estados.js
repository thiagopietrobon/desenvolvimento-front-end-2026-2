
import { renderizarTarefas } from "./renderizacao.js";

export function renderizarEstado(
    estado,
    tarefasVisiveis = []
) {
    const elementoStatus =
        document.querySelector("[data-estado]");

    const quadro =
        document.querySelector("[data-quadro]");

    function exibirMensagem(mensagem) {
        if (elementoStatus) {
            elementoStatus.textContent = mensagem;
        }

        if (quadro) {
            renderizarTarefas([], quadro);
        }
    }

    // 1. Carregamento
    if (estado.carregamento) {
        exibirMensagem(
            "Carregando tarefas, por favor aguarde..."
        );
        return;
    }

    // 2. Erro
    if (estado.erro) {
        const erro = estado.erro;
        let mensagem =
            "Ocorreu uma falha ao carregar as tarefas.";

        if (erro instanceof Error) {
            switch (erro.name) {
                case "OfflineError":
                case "NetworkError":
                case "ErroOffline":
                case "ErroRede":
                    mensagem =
                        "Erro de rede: não foi possível carregar " +
                        "as tarefas. Verifique sua conexão.";
                    break;

                case "SyntaxError":
                    mensagem =
                        "Erro de formato: o arquivo de dados " +
                        "não contém um JSON válido.";
                    break;

                case "HttpError":
                case "ErroHttp":
                    mensagem =
                        `Erro HTTP (${erro.status ?? "desconhecido"}): ` +
                        "não foi possível carregar os dados.";
                    break;

                default:
                    mensagem = `Erro: ${erro.message}`;
            }
        } else if (typeof erro === "string") {
            mensagem = erro;
        }

        exibirMensagem(mensagem);
        return;
    }

    // 3. Não existem tarefas cadastradas
    const totalOriginal = estado.tarefas.length;

    if (totalOriginal === 0) {
        exibirMensagem(
            "Nenhuma tarefa cadastrada no sistema no momento."
        );
        return;
    }

    // 4. Existem tarefas, mas os filtros não encontraram resultados
    if (tarefasVisiveis.length === 0) {
        exibirMensagem(
            "Nenhum resultado encontrado para os filtros " +
            `aplicados (0 de ${totalOriginal} tarefas).`
        );
        return;
    }

    // 5. Exibição normal
    if (elementoStatus) {
        elementoStatus.textContent =
            `Exibindo ${tarefasVisiveis.length} de ` +
            `${totalOriginal} tarefa(s).`;
    }

    if (quadro) {
        renderizarTarefas(tarefasVisiveis, quadro);
    }
}