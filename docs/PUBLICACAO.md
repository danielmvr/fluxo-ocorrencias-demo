# Publicação e manutenção

- [Repositório](https://github.com/danielmvr/fluxo-ocorrencias-demo)
- [Demonstração no GitHub Pages](https://danielmvr.github.io/fluxo-ocorrencias-demo/)

O projeto tem um histórico próprio e contém apenas a demonstração, seus dados fictícios, documentação e verificações. Para manter essa separação, trabalhe neste repositório e revise cada arquivo antes de publicar alterações.

## Fluxo de publicação

A origem do Pages é **GitHub Actions**, configurada em **Settings → Pages**. O workflow `.github/workflows/pages.yml` é acionado por commits na branch `main` ou execução manual.

O workflow usa Node.js 22 e executa, nesta ordem:

```bash
npm test
npm run audit
npm run build
```

O build prepara `.site/` com `index.html`, os recursos de `assets/` e `.nojekyll`. Somente esse diretório é enviado para o Pages. Documentação, testes e ferramentas de desenvolvimento permanecem no repositório.

O job usa as permissões `contents: read`, `pages: write` e `id-token: write` e o ambiente `github-pages`, conforme a [documentação oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Acompanhe cada publicação na aba **Actions**. Considere uma implantação concluída quando o workflow indicar sucesso e a página carregar no endereço público.

## Verificação local e pacote

Use Node.js 22 ou superior. Não é necessário instalar dependências.

```bash
npm start
npm test
npm run audit
npm run package
```

O pacote é gerado em `release/fluxo-ocorrencias-demo.zip`. Ele inclui somente a seleção revisada do código, sem histórico Git, `.site/`, dependências ou pacotes anteriores.

O comando `npm run audit` é uma verificação própria dos arquivos do projeto. Ao acrescentar arquivos ou dados, complemente-o com revisão do conteúdo.

## Apresentação no portfólio

Descrição do repositório:

> Demonstração de acompanhamento de ocorrências rodoviárias com dados sintéticos, JavaScript vanilla e persistência local.

O campo **Website** aponta para a demonstração. Tópicos sugeridos: `javascript`, `html`, `css`, `portfolio`, `localstorage` e `github-pages`.

O [texto para o LinkedIn](LINKEDIN.md) inclui os endereços do código e da demonstração. A captura `preview.png` apresenta somente o cenário fictício. A publicação do texto no LinkedIn é uma etapa independente da implantação do site.
