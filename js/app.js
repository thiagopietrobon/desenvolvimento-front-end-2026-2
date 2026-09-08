import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";
import { instalarEventosDoQuadro } from "./renderizacao.js";

// Armazena a referência das tarefas atuais na memória da aplicação
let tarefasAtuais = [];

/**
 * Função assíncrona principal de inicialização da interface.
 */
async function iniciarApp() {
    const quadro = document.querySelector("[data-quadro]");

    if (quadro) {
        //Instala os ouvintes de eventos delegados no quadro uma única vez
        instalarEventosDoQuadro(quadro, () => tarefasAtuais);
    }

    //Aplica o estado de carregando ANTES da requisição
    renderizarEstado("carregando");

    try {
        //Busca os dados via fetch em api.js
        const tarefas = await carregarTarefas();
        tarefasAtuais = tarefas;

        //Aplica o estado adequado com base no resultado da busca
        if (tarefas.length === 0) {
            renderizarEstado("vazio");
        } else {
            renderizarEstado("sucesso", tarefas);
        }
    } catch (erro) {
        //Captura falhas de rede, protocolo ou formato e aciona o estado de erro
        renderizarEstado("erro", erro);
        console.error("Falha na execução de carregarTarefas:", erro);
    }
}

// Inicializa a aplicação
iniciarApp();