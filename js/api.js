export async function carregarTarefas() {
    const resposta = await fetch("./dados.json");

    // Valida o status da resposta HTTP antes de consumir o corpo
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
}
