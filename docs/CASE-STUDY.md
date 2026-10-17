# Estudo de caso · Fluxo de Ocorrências

## O problema representado

Uma ocorrência rodoviária reúne informações que mudam durante o atendimento: localização, veículo, responsável, necessidade de apoio e andamento das ações. Quando esses elementos ficam espalhados, acompanhar o estado de cada caso exige reconstruir o contexto a cada consulta.

Esta demonstração organiza esse fluxo em uma interface única. O objetivo é mostrar como transformar uma necessidade operacional em interações claras, com um registro consultável desde a abertura até a conclusão.

## A solução demonstrada

O painel apresenta as ocorrências e permite filtrar o cenário. Cada registro reúne dados do veículo, local, tempo decorrido e sinalizações de atendimento. O formulário aproveita os cadastros para preencher informações relacionadas; a linha do tempo registra a evolução do caso.

Finalizar e reabrir uma ocorrência são ações do mesmo fluxo. Os cadastros, as importações e o backup permitem explorar como os dados de apoio se conectam à rotina de atendimento.

Uma base inicial fictícia torna o projeto navegável desde a primeira abertura. O botão **Experimentar uma abertura** ajuda a experimentar a criação de um registro e **Restaurar demonstração** permite repetir o percurso.

## Decisões de implementação

**HTML, CSS e JavaScript vanilla.** A demonstração dispensa instalação de pacotes para executar e pode ser hospedada como arquivos estáticos. A interface inclui um painel com ônibus em pixel art SVG e uma identidade visual própria, chamada Rota Demo.

**Acesso aos dados concentrado em `Store`.** A camada de armazenamento organiza as operações sobre os registros. A persistência usa a chave `rotaDemo.ocorrencias.v1` do `localStorage`, isolando os dados desta demonstração.

**Tempo relativo.** Os horários do cenário inicial são calculados em relação à abertura da demonstração. Assim, cronômetros e estados de urgência continuam úteis para explorar a interface em diferentes datas.

**Dados criados do zero.** Nomes de empresas, veículos, placas, linhas, localidades, apoios e responsáveis foram inventados. Não há reprodução de registros operacionais, contatos ou coordenadas. Essa escolha permite apresentar o fluxo sem publicar uma base real.

**Execução local e publicação estática.** Um servidor Node.js nativo atende ao desenvolvimento local. O pacote de publicação usa uma lista explícita de arquivos e o projeto inclui configuração para GitHub Pages via Actions.

## O que pode ser avaliado

Esta versão permite avaliar a organização do painel, as interações do formulário, os estados de uma ocorrência e o comportamento de persistência, importação e exportação no navegador. O cenário inclui quatro ocorrências ativas e 12 finalizadas; essas quantidades descrevem a base fictícia, não resultados de uma operação.

Não foram medidos ganhos de produtividade, redução de custos ou impacto no atendimento. O estudo de caso apresenta o funcionamento da demonstração e as decisões de construção.

## Limites e próximos passos

Os dados ficam restritos ao navegador. Não há autenticação, colaboração em tempo real, trilha de auditoria mantida por servidor, envio de mensagens ou acionamento de atendimento externo.

Uma evolução para uso compartilhado exigiria backend, autorização por perfil, validação dos dados no servidor e registro confiável das alterações. Integrações e métricas poderiam ser adicionadas a partir de requisitos e critérios de sucesso definidos para uma operação específica.

O [README](../README.md) explica como executar a demonstração. O [roteiro de publicação](PUBLICACAO.md) descreve a preparação de um repositório próprio para o portfólio.
