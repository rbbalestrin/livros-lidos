# Primeira versão

A v1 é um site em que dá para registrar leituras e acompanhar outras pessoas lendo. Se o diário não for bom de usar sozinho, o feed não salva o produto. Por isso o diário vem primeiro na ordem de construção.

## O que entra

**Conta.** Login e um nome de usuário único. Cada conta tem um perfil público com estante e diário. Feito: cadastro e login por e-mail. O nome de usuário é gerado a partir do nome e ainda não dá para editar.

**Busca de livros.** A busca consulta mais de uma fonte e junta os resultados pelo ISBN. Quando duas fontes descrevem o mesmo livro, guardamos um registro só e anotamos de onde veio cada campo. Feito com Open Library e BrasilAPI. Google Books só entra com chave de API, porque a cota anônima dele é zero.

Testei com Torto Arado, Dom Casmurro e um ISBN da Companhia das Letras. A BrasilAPI acerta editora e número de páginas das edições brasileiras, mas às vezes guarda o título em maiúsculas e sem acento. Nesses casos vale o título de outra fonte.

**Diário.** Registrar uma leitura pede só o livro e a data em que você terminou. Nota de meia em meia estrela, resenha e marca de releitura são opcionais. O mesmo livro pode aparecer várias vezes no diário. Feito.

**Estante.** Cada livro tem um estado: quero ler, lendo ou lido. Marcar como lido abre o registro no diário. Por enquanto só existe o lado de dentro: registrar uma leitura marca o livro como lido, mas a tela da estante ainda não existe.

**Seguir e feed.** Você segue alguém sem precisar de aprovação. O feed mostra as entradas de diário de quem você segue, da mais nova para a mais antiga. Falta fazer.

**Idiomas.** A interface sai em português do Brasil e inglês. Título e sinopse aparecem no idioma em que a fonte entrega. Feito.

## O que fica para depois

Curtidas, comentários, importação do Goodreads, recomendações e os apps de iOS e Android.

## Decisões tomadas

- Site antes do iOS.
- SvelteKit, Convex, Effect e Better Auth.
- Três telas para as leituras, cada uma com um papel. O Diário acompanha o progresso e tem cara de caderno: a resenha vem em destaque e a data fica grande na margem. A Estante mostra listas que você cria, com os livros como lombadas. O Ano em leitura junta os números do ano, um gráfico por mês e uma tabela. O Diário entra primeiro; as outras duas vêm depois. O protótipo das três está no branch `prototype/diario-variantes`.

## Decisões em aberto

- Perfil privado. Todo perfil é público na v1, ou já precisa existir a opção de fechar?
- Denúncia e bloqueio. Resenha aparece no feed de outras pessoas, então algum mínimo deve entrar.
- Spoiler. Marcar uma resenha como spoiler custa pouco e importa muito em livro.
- Hospedagem. Nada foi publicado ainda. O site e a Convex rodam só na máquina local.
