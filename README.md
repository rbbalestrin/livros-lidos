# Livros Lidos

Uma rede social para registrar o que você lê e ver o que seus amigos estão lendo. Cada leitura vira uma entrada no diário, com data, nota e, se quiser, uma resenha. Quem te segue vê isso no feed.

O site sai primeiro, em português e inglês. Apps nativos para iOS e Android vêm depois, usando o mesmo backend. O recorte da primeira versão está em [docs/produto.md](docs/produto.md).

## O que já funciona

Criar conta com e-mail e senha, buscar um livro por título, autor ou ISBN, registrar a leitura e ver o diário agrupado por mês. Português fica em `/` e inglês em `/en`.

## Stack

SvelteKit 3 com Svelte 5 e Tailwind 4 no site. Convex guarda os dados e roda as funções. Better Auth cuida do login dentro do Convex, e o site repassa as chamadas por `/api/auth`. A busca no catálogo usa Effect para consultar as fontes em paralelo, com tempo limite e uma nova tentativa por fonte. Paraglide gera as traduções a partir de `messages/`.

## Rodar local

Precisa de Node 22 ou mais novo e pnpm. Nenhuma conta na Convex é necessária: o backend roda na sua máquina.

```sh
pnpm install
pnpm convex            # primeiro terminal; cria .env.local na primeira vez
```

Na primeira vez, com o `pnpm convex` rodando, configure o login:

```sh
npx convex env set SITE_URL http://localhost:5173
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
```

Depois, num segundo terminal:

```sh
pnpm dev               # http://localhost:5173
```

`pnpm check` confere os tipos do site e do Convex, `pnpm test` roda os testes e `pnpm lint` confere formatação e lint.

## Fontes do catálogo

| Fonte | Para que serve | Chave |
| --- | --- | --- |
| Open Library | Busca por texto e capas | Não precisa |
| BrasilAPI (ISBN) | Editora, páginas e ano de edições brasileiras | Não precisa |
| Google Books | Mais um ponto de cruzamento | `GOOGLE_BOOKS_API_KEY` no Convex; sem ela, a fonte fica de fora |

Quando duas fontes descrevem o mesmo ISBN, o livro vira um registro só e cada campo guarda de qual fonte veio. A regra está em `src/lib/catalog/merge.ts`.
