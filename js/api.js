export async function carregarTarefas() {
    if (!navigator.onLine) {
        const erroOffline = new Error("Sem conexão com a internet.");
        erroOffline.name = "OfflineError";
        throw erroOffline;
    }

    try {
        const resposta = await fetch("./dados.json");

        if (!resposta.ok) {
            const erroProtocolo = new Error(
                `Erro de protocolo HTTP: status ${resposta.status}`,
            );
            erroProtocolo.name = "HttpError";
            erroProtocolo.status = resposta.status;
            throw erroProtocolo;
        }

        const dados = await resposta.json();

        if (!dados || !Array.isArray(dados.tarefas)) {
            const erroFormato = new SyntaxError(
                'Estrutura de JSON inválida: a propriedade "tarefas" deve ser um Array.',
            );
            throw erroFormato;
        }

        return dados.tarefas;
    } catch (erro) {
        // Preserva os erros já tratados (HttpError, SyntaxError, OfflineError)
        if (erro.name === "HttpError" || erro.name === "SyntaxError" || erro.name === "OfflineError") {
            throw erro;
        }

        // Converte falhas diretas de rede (ex: TypeError do fetch) em um erro identificado
        const erroRede = new Error("Falha na conexão de rede.");
        erroRede.name = "NetworkError";
        throw erroRede;
    }
}