const ROTULOS_STATUS = {
    "a-fazer": "A Fazer",
    "em-andamento": "Em Andamento",
    "em-revisao": "Em Revisão",
    "concluida": "Concluída",
};


const STATUS = [
    "a-fazer",
    "em-andamento",
    "em-revisao",
    "concluida",
];


const PRIORIDADES = [
    "Baixa",
    "Média",
    "Alta",
];


function criarLinhaMeta(
    rotulo,
    valor,
    classe = ""
) {
    const linha =
        document.createElement("p");


    if (classe) {
        linha.className = classe;
    }


    const destaque =
        document.createElement("strong");

    destaque.textContent =
        `${rotulo}: `;


    const texto =
        document.createElement("span");

    texto.textContent =
        valor;


    linha.append(
        destaque,
        texto
    );


    return linha;
}


function formatarData(data) {
    if (!data) {
        return "Não definido";
    }


    const partes =
        String(data).match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );


    if (!partes) {
        return String(data);
    }


    return `${partes[3]}/${partes[2]}/${partes[1]}`;
}


function criarCampo(
    rotulo,
    nome,
    tipo = "text",
    valor = ""
) {
    const campo =
        document.createElement("label");

    campo.className =
        "modal-tarefa-campo";


    const texto =
        document.createElement("span");

    texto.textContent =
        rotulo;


    const input =
        document.createElement("input");

    input.name = nome;
    input.type = tipo;
    input.value = valor ?? "";


    if (nome === "titulo") {
        input.required = true;
    }


    campo.append(
        texto,
        input
    );


    return campo;
}


function criarOpcoesSegmentadas(
    rotulo,
    nome,
    opcoes,
    valorAtual
) {
    const grupo =
        document.createElement("fieldset");

    grupo.className =
        "modal-tarefa-segmentado";


    const legenda =
        document.createElement("legend");

    legenda.textContent =
        rotulo;


    const opcoesContainer =
        document.createElement("div");

    opcoesContainer.className =
        "modal-segmentos";


    opcoes.forEach(
        ([valor, texto]) => {

            const id =
                `modal-${nome}-${valor}`
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        "-"
                    );


            const item =
                document.createElement("label");

            item.className =
                "modal-segmento";


            const input =
                document.createElement("input");

            input.type = "radio";
            input.name = nome;
            input.value = valor;
            input.checked =
                valor === valorAtual;


            input.id = id;


            const span =
                document.createElement("span");

            span.textContent =
                texto;


            item.append(
                input,
                span
            );


            opcoesContainer.append(
                item
            );
        }
    );


    grupo.append(
        legenda,
        opcoesContainer
    );


    return grupo;
}


function obterModal() {
    let modal =
        document.getElementById(
            "modal-detalhes-tarefa"
        );


    if (modal) {
        return modal;
    }


    modal =
        document.createElement("dialog");


    modal.id =
        "modal-detalhes-tarefa";

    modal.className =
        "modal-tarefa";


    modal.setAttribute(
        "aria-labelledby",
        "modal-tarefa-titulo"
    );


    const conteudo =
        document.createElement("div");

    conteudo.className =
        "modal-tarefa-conteudo";


    const topo =
        document.createElement("div");

    topo.className =
        "modal-tarefa-topo";


    const titulo =
        document.createElement("h2");

    titulo.id =
        "modal-tarefa-titulo";


    const fechar =
        document.createElement("button");

    fechar.type = "button";
    fechar.className =
        "modal-tarefa-fechar";

    fechar.textContent =
        "Fechar";


    fechar.addEventListener(
        "click",
        () => modal.close()
    );


    topo.append(
        titulo,
        fechar
    );


    const corpo =
        document.createElement("div");

    corpo.className =
        "modal-tarefa-corpo";

    corpo.dataset.modalCorpo = "";


    conteudo.append(
        topo,
        corpo
    );


    modal.append(
        conteudo
    );


    modal.addEventListener(
        "click",
        (evento) => {

            if (
                evento.target ===
                modal
            ) {
                modal.close();
            }
        }
    );


    document.body.append(
        modal
    );


    return modal;
}


function abrirDetalhes(
    tarefa,
    botaoOrigem,
    salvarTarefa,
    excluirTarefa
) {
    const modal =
        obterModal();


    const titulo =
        modal.querySelector(
            "#modal-tarefa-titulo"
        );


    const corpo =
        modal.querySelector(
            "[data-modal-corpo]"
        );


    titulo.textContent =
        tarefa.titulo ||
        "Detalhes da tarefa";


    const form =
        document.createElement("form");

    form.className =
        "modal-tarefa-form";


    form.addEventListener(
        "submit",
        (evento) => {

            evento.preventDefault();


            const dados =
                new FormData(form);


            const tituloAtualizado =
                String(
                    dados.get("titulo") ?? ""
                ).trim();


            if (!tituloAtualizado) {
                return;
            }


            const status =
                String(
                    dados.get("status") ??
                    tarefa.status
                );


            const prioridade =
                String(
                    dados.get("prioridade") ??
                    tarefa.prioridade
                );


            const prazo =
                String(
                    dados.get("prazo") ?? ""
                );


            const atualizado = {
                ...tarefa,
                titulo: tituloAtualizado,
                status,
                prioridade,
                prazo,
            };


            delete atualizado.atrasada;


            salvarTarefa(
                atualizado
            );


            modal.close();
        }
    );


    form.append(
        criarCampo(
            "Título",
            "titulo",
            "text",
            tarefa.titulo
        )
    );


    form.append(
        criarOpcoesSegmentadas(
            "Status",
            "status",
            STATUS.map(
                (status) => [
                    status,
                    ROTULOS_STATUS[status],
                ]
            ),
            tarefa.status
        )
    );


    form.append(
        criarOpcoesSegmentadas(
            "Prioridade",
            "prioridade",
            PRIORIDADES.map(
                (prioridade) => [
                    prioridade,
                    prioridade,
                ]
            ),
            tarefa.prioridade
        )
    );


    form.append(
        criarCampo(
            "Prazo",
            "prazo",
            "date",
            tarefa.prazo
        )
    );


    form.append(
        criarLinhaMeta(
            "Projeto",
            tarefa.projeto ||
            "Geral"
        )
    );


    form.append(
        criarLinhaMeta(
            "Responsável",
            tarefa.responsavel ||
            "Não atribuído"
        )
    );


    const footer =
        document.createElement("div");

    footer.className =
        "modal-tarefa-acoes";


    const cancelar =
        document.createElement("button");

    cancelar.type = "button";
    cancelar.textContent =
        "Cancelar";


    cancelar.addEventListener(
        "click",
        () => modal.close()
    );


    const excluir =
        document.createElement("button");

    excluir.type = "button";
    excluir.className =
        "botao-excluir-tarefa";

    excluir.textContent =
        "Excluir tarefa";


    excluir.addEventListener(
        "click",
        () => {

            const confirmar =
                window.confirm(
                    `Tem certeza de que deseja excluir “${tarefa.titulo}”? Esta ação não pode ser desfeita.`
                );


            if (!confirmar) {
                return;
            }


            excluirTarefa(
                tarefa.id
            );


            modal.close();
        }
    );


    const salvar =
        document.createElement("button");

    salvar.type = "submit";

    salvar.className =
        "botao-salvar-tarefa";

    salvar.textContent =
        "Salvar alterações";


    footer.append(
        cancelar,
        excluir,
        salvar
    );


    form.append(
        footer
    );


    corpo.replaceChildren(
        form
    );


    modal.addEventListener(
        "close",
        function restaurarFoco() {

            modal.removeEventListener(
                "close",
                restaurarFoco
            );


            botaoOrigem?.focus();
        }
    );


    modal.showModal();


    form
        .querySelector(
            '[name="titulo"]'
        )
        ?.focus();
}


export function criarCartao(
    tarefa
) {
    const cartao =
        document.createElement(
            "article"
        );


    cartao.className =
        `cartao cartao--${tarefa.status}`;


    if (tarefa.atrasada) {
        cartao.classList.add(
            "cartao--atrasada"
        );
    }


    cartao.dataset.tarefaId =
        tarefa.id;


    const topo =
        document.createElement("div");

    topo.className =
        "cartao-topo";


    const status =
        document.createElement("span");

    status.className =
        `badge-status badge-status--${tarefa.status}`;


    status.textContent =
        ROTULOS_STATUS[tarefa.status] ??
        tarefa.status;


    topo.append(
        status
    );


    const titulo =
        document.createElement("h4");

    titulo.textContent =
        tarefa.titulo;


    const projeto =
        criarLinhaMeta(
            "Projeto",
            tarefa.projeto ||
            "Geral"
        );


    const responsavel =
        criarLinhaMeta(
            "Responsável",
            tarefa.responsavel ||
            "Não atribuído"
        );


    const prioridade =
        document.createElement(
            "span"
        );


    const classePrioridade =
        String(
            tarefa.prioridade || ""
        )
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );


    prioridade.className =
        `badge-prioridade badge-prioridade--${classePrioridade}`;


    prioridade.textContent =
        `⚑ ${
            tarefa.prioridade ||
            "Sem prioridade"
        }`;


    const prazo =
        document.createElement("p");

    prazo.className =
        "cartao-prazo";


    const iconePrazo =
        document.createElement("span");

    iconePrazo.setAttribute(
        "aria-hidden",
        "true"
    );

    iconePrazo.textContent =
        "▦";


    prazo.append(
        iconePrazo,
        document.createTextNode(
            ` Prazo: ${formatarData(
                tarefa.prazo
            )}`
        )
    );


    if (tarefa.atrasada) {

        const aviso =
            document.createElement(
                "span"
            );


        aviso.className =
            "etiqueta-atraso";


        aviso.textContent =
            "⚠ TAREFA ATRASADA";


        aviso.setAttribute(
            "role",
            "status"
        );


        cartao.append(
            aviso
        );
    }


    const botao =
        document.createElement(
            "button"
        );


    botao.type = "button";

    botao.dataset.acao =
        "ver-detalhes";

    botao.textContent =
        "Ver detalhes →";


    cartao.append(
        topo,
        titulo,
        projeto,
        responsavel,
        prioridade,
        prazo,
        botao
    );


    return cartao;
}


export function renderizarTarefas(
    tarefas,
    quadro
) {
    if (!quadro) {
        return;
    }


    quadro
        .querySelectorAll(
            "[data-lista-status]"
        )
        .forEach((lista) => {

            const status =
                lista.dataset.listaStatus;


            const grupo =
                tarefas.filter(
                    (tarefa) =>
                        tarefa.status ===
                        status
                );


            const secao =
                lista.closest(
                    "section[data-coluna]"
                );


            const titulo =
                secao?.querySelector(
                    "h3"
                );


            if (titulo) {

                let contador =
                    titulo.querySelector(
                        ".contador-coluna"
                    );


                if (!contador) {

                    contador =
                        document.createElement(
                            "span"
                        );


                    contador.className =
                        "contador-coluna";


                    contador.setAttribute(
                        "aria-label",
                        "Quantidade de tarefas"
                    );


                    titulo.append(
                        contador
                    );
                }


                contador.textContent =
                    String(
                        grupo.length
                    );
            }


            if (!grupo.length) {

                const vazio =
                    document.createElement(
                        "li"
                    );


                vazio.className =
                    "coluna-vazia";


                vazio.textContent =
                    "✨ Tudo tranquilo por aqui";


                lista.replaceChildren(
                    vazio
                );


                return;
            }


            const itens =
                grupo.map(
                    (tarefa) => {

                        const li =
                            document.createElement(
                                "li"
                            );


                        li.append(
                            criarCartao(
                                tarefa
                            )
                        );


                        return li;
                    }
                );


            lista.replaceChildren(
                ...itens
            );
        });
}


export function instalarEventosDoQuadro(
    quadro,
    obterTarefas,
    salvarTarefa,
    excluirTarefa
) {
    if (!quadro) {
        return;
    }


    quadro.addEventListener(
        "click",
        (evento) => {

            if (
                !(evento.target instanceof Element)
            ) {
                return;
            }


            const botao =
                evento.target.closest(
                    'button[data-acao="ver-detalhes"]'
                );


            if (
                !botao ||
                !quadro.contains(botao)
            ) {
                return;
            }


            const cartao =
                botao.closest(
                    "[data-tarefa-id]"
                );


            if (!cartao) {
                return;
            }


            const tarefas =
                typeof obterTarefas ===
                "function"
                    ? obterTarefas()
                    : obterTarefas;


            if (!Array.isArray(tarefas)) {
                return;
            }


            const tarefa =
                tarefas.find(
                    (item) =>
                        String(item.id) ===
                        String(
                            cartao.dataset.tarefaId
                        )
                );


            if (!tarefa) {
                return;
            }


            abrirDetalhes(
                tarefa,
                botao,
                salvarTarefa,
                excluirTarefa
            );
        }
    );
}