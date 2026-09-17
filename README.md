# TaskFlow — Gerenciador de Tarefas Acadêmicas

Aplicação web desenvolvida para a disciplina de **Desenvolvimento Front-End**, com foco na organização e no acompanhamento de tarefas acadêmicas por etapa, prioridade e prazo.

[![Acessar aplicação](https://img.shields.io/badge/GitHub%20Pages-Acessar%20aplica%C3%A7%C3%A3o-5865d8?style=for-the-badge&logo=github)](https://thiagopietrobon.github.io/desenvolvimento-front-end-2026-2/)

## Visão geral

O TaskFlow apresenta um quadro de tarefas dividido em quatro etapas: **A Fazer**, **Em Andamento**, **Em Revisão** e **Concluída**. A interface utiliza uma identidade visual azul-violeta, cartões e indicadores de progresso, com adaptação para telas menores.

## Funcionalidades

- Visualização das tarefas organizadas por status.
- Busca por título e filtros por status e prioridade.
- Ordenação por prazo crescente ou decrescente.
- Limpeza dos filtros e remoção individual dos filtros ativos.
- Indicador de progresso geral e contagem de tarefas por etapa.
- Modal para consultar e editar título, status, prioridade e prazo.
- Exclusão de tarefas com confirmação.
- Identificação visual de prioridade e status.
- Navegação adaptada para dispositivos móveis, com menu lateral e abas para alternar entre etapas.
- Avisos de sucesso ou falha ao salvar alterações.
- Persistência das alterações no armazenamento local do navegador.

## Tecnologias

- HTML5
- CSS3 (layout responsivo, Grid e Flexbox)
- JavaScript moderno com módulos ES
- JSON para os dados iniciais
- `localStorage` para persistência local

## Como executar localmente

1. Clone ou baixe este repositório.
2. Abra a pasta no Visual Studio Code.
3. Execute o `index.html` com uma extensão de servidor local, como Live Server.
4. A aplicação carrega os dados iniciais de `dados.json`.

> O carregamento de `dados.json` precisa ocorrer por um servidor HTTP local; abrir o HTML diretamente via `file://` pode impedir a requisição do arquivo.

## Persistência dos dados

As edições e exclusões são armazenadas no `localStorage` do navegador utilizado. Isso significa que as alterações permanecem nesse navegador, mas **não modificam `dados.json` no repositório nem são sincronizadas entre dispositivos**. Para voltar aos dados iniciais, remova a chave `gerenciador-academico-tarefas` do armazenamento local do site.

## Estrutura do projeto

```text
├── index.html
├── styles.css
├── modal.css
├── dados.json
└── js/
    ├── api.js
    ├── app.js
    ├── estados.js
    └── renderizacao.js
```

## Autoria

**Thiago Henrique B. Pietrobon**  
Disciplina: Desenvolvimento Front-End
