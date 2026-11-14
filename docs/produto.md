# Primeira versão

A v1 é um site em que dá para registrar leituras e acompanhar outras pessoas lendo. Se o diário não for bom de usar sozinho, o feed não salva o produto. Por isso o diário vem primeiro na ordem de construção.

## O que entra

**Conta.** Login e um nome de usuário único. Cada conta tem um perfil público com estante e diário.

**Busca de livros.** A busca consulta mais de uma fonte e junta os resultados pelo ISBN. Quando duas fontes descrevem o mesmo livro, guardamos um registro só e anotamos de onde veio cada campo. As fontes candidatas são Open Library, Google Books e a API de ISBN da BrasilAPI. Ainda não testei nenhuma delas com livros brasileiros.

**Diário.** Registrar uma leitura pede só o livro e a data em que você terminou. Nota de meia em meia estrela, resenha e marca de releitura são opcionais. O mesmo livro pode aparecer várias vezes no diário.

**Estante.** Cada livro tem um estado: quero ler, lendo ou lido. Marcar como lido abre o registro no diário.

**Seguir e feed.** Você segue alguém sem precisar de aprovação. O feed mostra as entradas de diário de quem você segue, da mais nova para a mais antiga.

**Idiomas.** A interface sai em português do Brasil e inglês. Título e sinopse aparecem no idioma em que a fonte entrega.

## O que fica para depois

Listas, curtidas, comentários, importação do Goodreads, recomendações e os apps de iOS e Android.

## Decisões em aberto

- Backend. A recomendação atual é Convex com SvelteKit e Effect. Ainda não está fechada.
- Perfil privado. Todo perfil é público na v1, ou já precisa existir a opção de fechar?
- Denúncia e bloqueio. Resenha aparece no feed de outras pessoas, então algum mínimo deve entrar.
- Spoiler. Marcar uma resenha como spoiler custa pouco e importa muito em livro.
