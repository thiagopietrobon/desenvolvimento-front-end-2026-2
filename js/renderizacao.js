
const ROTULOS_STATUS = {
    "a-fazer": "A Fazer",
    "em-andamento": "Em Andamento",
    "em-revisao": "Em Revisão",
    "concluida": "Concluída"
};

const STATUS = [
    "a-fazer",
    "em-andamento",
    "em-revisao",
    "concluida"
];

const PRIORIDADES = ["Baixa", "Média", "Alta"];

function criarLinhaMeta(rotulo, valor, classe = "") {
    const linha = document.createElement("p");

    if (classe) linha.className = classe;

    const r = document.createElement("strong");
    r.textContent = `${rotulo}: `;

    const v = document.createElement("span");
    v.textContent = valor;

    linha.append(r, v);

    return linha;
}

function formatarData(data) {
    if (!data) return "Não definido";

    const partes = String(data).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    return partes
        ? `${partes[3]}/${partes[2]}/${partes[1]}`
        : String(data);
}

function criarCampo(rotulo, nome, tipo = "text", valor = "") {
    const label = document.createElement("label");
    label.className = "modal-tarefa-campo";
    label.textContent = rotulo;

    const input = document.createElement("input");
    input.name = nome;
    input.type = tipo;
    input.value = valor ?? "";
    input.required = nome === "titulo";

    label.append(input);

    return label;
}

function criarSelect(rotulo, nome, opcoes, valor) {
    const label = document.createElement("label");
    label.className = "modal-tarefa-campo";
    label.textContent = rotulo;

    const select = document.createElement("select");
    select.name = nome;

    opcoes.forEach(([v, t]) => {
        const opcao = document.createElement("option");
        opcao.value = v;
        opcao.textContent = t;
        select.append(opcao);
    });

    select.value = valor;
    label.append(select);

    return label;
}

function obterModal() {
    let modal = document.getElementById("modal-detalhes-tarefa");

    if (modal) return modal;

    modal = document.createElement("dialog");
    modal.id = "modal-detalhes-tarefa";
    modal.className = "modal-tarefa";
    modal.setAttribute("aria-labelledby", "modal-tarefa-titulo");

    const conteudo = document.createElement("div");
    conteudo.className = "modal-tarefa-conteudo";

    const topo = document.createElement("div");
    topo.className = "modal-tarefa-topo";

    const titulo = document.createElement("h2");
    titulo.id = "modal-tarefa-titulo";

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "modal-tarefa-fechar";
    fechar.textContent = "Fechar";
    fechar.addEventListener("click", () => modal.close());

    topo.append(titulo, fechar);

    const corpo = document.createElement("div");
    corpo.className = "modal-tarefa-corpo";
    corpo.dataset.modalCorpo = "";

    conteudo.append(topo, corpo);
    modal.append(conteudo);

    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) modal.close();
    });

    document.body.append(modal);

    return modal;
}

function abrirDetalhes(tarefa, botaoOrigem, salvarTarefa, excluirTarefa) {
    const modal = obterModal();

    const titulo = modal.querySelector("#modal-tarefa-titulo");
    const corpo = modal.querySelector("[data-modal-corpo]");

    titulo.textContent = tarefa.titulo || "Detalhes da tarefa";

    const form = document.createElement("form");
    form.className = "modal-tarefa-form";

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const dados = new FormData(form);

        const atualizado = {
            ...tarefa,
            titulo: String(dados.get("titulo")).trim(),
            status: String(dados.get("status")),
            prioridade: String(dados.get("prioridade")),
            prazo: String(dados.get("prazo") || "")
        };

        if (!atualizado.titulo) return;

        salvarTarefa(atualizado);
        modal.close();
    });

    form.append(
        criarCampo("Título", "titulo", "text", tarefa.titulo),
        criarSelect(
            "Status",
            "status",
            STATUS.map((status) => [
                status,
                ROTULOS_STATUS[status]
            ]),
            tarefa.status
        ),
        criarSelect(
            "Prioridade",
            "prioridade",
            PRIORIDADES.map((prioridade) => [
                prioridade,
                prioridade
            ]),
            tarefa.prioridade
        ),
        criarCampo("Prazo", "prazo", "date", tarefa.prazo)
    );

    form.append(
        criarLinhaMeta("Projeto", tarefa.projeto || "Geral"),
        criarLinhaMeta(
            "Responsável",
            tarefa.responsavel || "Não atribuído"
        )
    );

    const footer = document.createElement("div");
    footer.className = "modal-tarefa-acoes";

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";
    cancelar.addEventListener("click", () => modal.close());

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "botao-excluir-tarefa";
    excluir.textContent = "Excluir tarefa";

    excluir.addEventListener("click", () => {
        if (
            window.confirm(
                `Tem certeza de que deseja excluir “${tarefa.titulo}”? Esta ação não pode ser desfeita.`
            )
        ) {
            excluirTarefa(tarefa.id);
            modal.close();
        }
    });

    const salvar = document.createElement("button");
    salvar.type = "submit";
    salvar.textContent = "Salvar alterações";

    footer.append(cancelar, excluir, salvar);
    form.append(footer);

    corpo.replaceChildren(form);

    modal.addEventListener("close", function restaurar() {
        modal.removeEventListener("close", restaurar);
        botaoOrigem?.focus();
    });

    modal.showModal();
    form.querySelector("[name=titulo]").focus();
}

export function criarCartao(tarefa) {
    const cartao = document.createElement("article");

    cartao.className = `cartao cartao--${tarefa.status}`;

    if (tarefa.atrasada) {
        cartao.classList.add("cartao--atrasada");
    }

    cartao.dataset.tarefaId = tarefa.id;

    const topo = document.createElement("div");
    topo.className = "cartao-topo";

    const status = document.createElement("span");
    status.className = `badge-status badge-status--${tarefa.status}`;
    status.textContent =
        ROTULOS_STATUS[tarefa.status] || tarefa.status;

    topo.append(status);

    const titulo = document.createElement("h4");
    titulo.textContent = tarefa.titulo;

    const prioridade = document.createElement("span");

    const classePrioridade = String(tarefa.prioridade || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    prioridade.className =
        `badge-prioridade badge-prioridade--${classePrioridade}`;

    prioridade.textContent =
        `⚑ ${tarefa.prioridade || "Sem prioridade"}`;

    const prazo = document.createElement("p");
    prazo.className = "cartao-prazo";
    prazo.textContent = `▦ Prazo: ${formatarData(tarefa.prazo)}`;

    if (tarefa.atrasada) {
        const aviso = document.createElement("span");

        aviso.className = "etiqueta-atraso";
        aviso.textContent = "⚠ TAREFA ATRASADA";
        aviso.setAttribute("role", "status");

        cartao.append(aviso);
    }

    const botao = document.createElement("button");
    botao.type = "button";
    botao.dataset.acao = "ver-detalhes";
    botao.textContent = "Ver detalhes →";

    cartao.append(
        topo,
        titulo,
        criarLinhaMeta("Projeto", tarefa.projeto || "Geral"),
        criarLinhaMeta(
            "Responsável",
            tarefa.responsavel || "Não atribuído"
        ),
        prioridade,
        prazo,
        botao
    );

    return cartao;
}

export function renderizarTarefas(tarefas, quadro) {
    if (!quadro) return;

    quadro.querySelectorAll("[data-lista-status]").forEach((lista) => {
        const status = lista.dataset.listaStatus;

        const grupo = tarefas.filter(
            (tarefa) => tarefa.status === status
        );

        const secao = lista.closest(
            'section[aria-labelledby^="quadro-"]'
        );

        const titulo = secao?.querySelector("h3");

        if (titulo) {
            let contador = titulo.querySelector(".contador-coluna");

            if (!contador) {
                contador = document.createElement("span");
                contador.className = "contador-coluna";
                contador.setAttribute(
                    "aria-label",
                    "Quantidade de tarefas"
                );
                titulo.append(contador);
            }

            contador.textContent = String(grupo.length);
        }

        if (!grupo.length) {
            const vazio = document.createElement("li");
            vazio.className = "coluna-vazia";
            vazio.textContent = "✨ Tudo tranquilo por aqui";

            lista.replaceChildren(vazio);
        } else {
            lista.replaceChildren(
                ...grupo.map((tarefa) => {
                    const li = document.createElement("li");
                    li.append(criarCartao(tarefa));
                    return li;
                })
            );
        }
    });
}

export function instalarEventosDoQuadro(
    quadro,
    obterTarefas,
    salvarTarefa,
    excluirTarefa
) {
    if (!quadro) return;

    quadro.addEventListener("click", (evento) => {
        if (!(evento.target instanceof Element)) return;

        const botao = evento.target.closest(
            'button[data-acao="ver-detalhes"]'
        );

        if (!botao || !quadro.contains(botao)) return;

        const cartao = botao.closest("[data-tarefa-id]");

        if (!cartao) return;

        const tarefas =
            typeof obterTarefas === "function"
                ? obterTarefas()
                : obterTarefas;

        const tarefa = Array.isArray(tarefas)
            ? tarefas.find(
                (item) =>
                    String(item.id) ===
                    String(cartao.dataset.tarefaId)
            )
            : null;

        if (tarefa) {
            abrirDetalhes(
                tarefa,
                botao,
                salvarTarefa,
                excluirTarefa
            );
        }
    });
}