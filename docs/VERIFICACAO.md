# Verificação da demonstração

Validação realizada localmente em 17/10/2026, com Node.js 24.14.0. A primeira implantação também concluiu com sucesso no GitHub Actions usando Node.js 22, incluindo testes, auditoria, build e deploy: [execução verificada](https://github.com/danielmvr/fluxo-ocorrencias-demo/actions/runs/39038642088).

## Verificações automatizadas

Os 12 testes de `npm test` cobrem a geração de dados, a chave exclusiva de armazenamento, o preenchimento da frota, os tempos de passageiros e mecânica, a finalização, a reabertura, o atendimento atravessando meia-noite, backups e rejeição de importações inválidas.

`npm run audit` verifica a estrutura publicável, ausência de clientes de rede no aplicativo, recursos externos e padrões comuns de segredo. Essa verificação é complementada pela revisão dos arquivos; não constitui uma garantia universal sobre qualquer conteúdo que venha a ser acrescentado ao projeto.

## Conferência pela interface

- Painel carregado com os quatro cenários fictícios e seus status.
- Exemplo preenchido e nova ocorrência criada pela interface.
- Atualização adicionada e exibida na linha do tempo.
- Finalização confirmada e ocorrência localizada no histórico.
- Base inicial restaurada e persistência conferida após recarregar.
- Captura do painel salva em `preview.png`; console sem erros ou avisos na captura final.
- Endereço público conferido com quatro cards no painel, filtro por empresa funcionando e 12 registros no histórico; console sem erros ou avisos nessa navegação.

Exportações, importações de arquivos e todos os tamanhos de tela não receberam uma verificação manual completa. Os testes automatizados cobrem as regras de dados descritas acima.

## Publicação

A configuração de Pages segue o [workflow oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). As execuções e seus resultados ficam disponíveis na [aba Actions](https://github.com/danielmvr/fluxo-ocorrencias-demo/actions).
