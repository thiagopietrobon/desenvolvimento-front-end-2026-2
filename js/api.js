
const CAMINHO_DADOS = "./dados.json";

class ErroHttp extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.name = "ErroHttp";
        this.status = status;
    }
}

class ErroRede extends Error {
    constructor(mensagem) {
        super(mensagem);
        this.name = "ErroRede";
    }
}

class ErroOffline extends Error {
    constructor(mensagem) {
        super(mensagem);
        this.name = "ErroOffline";
    }
}

function validarEstruturaDados(dados) {
    if (
        !dados ||
        typeof dados !== "object" ||
        !Array.isArray(dados.tarefas)
    ) {
        throw new SyntaxError(
            'O arquivo dados.json precisa conter um array "tarefas".'
        );
    }

    return dados.tarefas;
}

async function carregarTarefas() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new ErroOffline(
            "O navegador informa que está sem conexão."
        );
    }

    let resposta;

    try {
        resposta = await fetch(CAMINHO_DADOS);
    } catch (erro) {
        if (
            typeof navigator !== "undefined" &&
            !navigator.onLine
        ) {
            throw new ErroOffline(
                "Não foi possível carregar os dados sem conexão."
            );
        }

        throw new ErroRede(
            "Não foi possível acessar o arquivo de tarefas."
        );
    }

    if (!resposta.ok) {
        throw new ErroHttp(
            resposta.status,
            `Falha ao carregar dados: HTTP ${resposta.status}.`
        );
    }

    let dados;

    try {
        dados = await resposta.json();
    } catch {
        throw new SyntaxError(
            "O arquivo de dados não contém um JSON válido."
        );
    }

    return validarEstruturaDados(dados);
}

export {
    carregarTarefas,
    ErroHttp,
    ErroRede,
    ErroOffline
};