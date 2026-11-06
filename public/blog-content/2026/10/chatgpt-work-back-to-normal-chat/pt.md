Há pouco me aconteceu algo bastante absurdo com o ChatGPT. Entrei como sempre e apareceu um convite para experimentar o **Work** com o típico botão **«Try Work»**. E já aviso: sei o que é o Work e já tinha usado. Cliquei mais pensando *«vamos ver se colocaram algo novo no Work»*.

Meu raciocínio foi bem simples: *«Ah, tudo bem, vai me levar ao Work, eu vejo o que tem de novo e depois volto ao ChatGPT de sempre»*. Como acontece com tantas funções novas. Não imaginei que esse clique pudesse complicar algo tão básico quanto iniciar uma conversa normal.

Mas quando quis voltar, veio a surpresa: **o ChatGPT continuava abrindo no Work e o seletor para alternar entre Chat e Work não aparecia mais**. Ou seja, justamente a opção que eu esperava usar para desfazer a mudança parecia ter sumido.

Eu não estava tentando ativar o Work como minha forma habitual de usar o ChatGPT. Só queria ver as novidades. Então fui investigar como recuperar a interface normal e reuni estas alternativas caso aconteça com mais alguém.

> **Nota:** as soluções da comunidade que aparecem aqui são *workarounds*, não correções oficiais garantidas. A interface do ChatGPT muda com frequência e algumas alternativas funcionam só na web ou só no aplicativo para computador.

## O que é o ChatGPT Work e por que ele parece diferente?

O ChatGPT tem duas experiências distintas: **Chat**, para conversar, fazer perguntas e usar o assistente da maneira habitual, e **Work**, voltada a tarefas mais longas que exigem vários passos. **Codex** é outra experiência, focada em programação.

Não é que o Work seja ruim. Simplesmente não quero usá-lo para tudo. Se entro para fazer uma pergunta rápida, o lógico é poder iniciar um chat normal sem brigar com a interface.

Segundo a [documentação da OpenAI sobre ChatGPT Work e Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex), no aplicativo para computador deveria ser possível selecionar **ChatGPT** e depois escolher **Chat** ou **Work**. O problema começa quando esse seletor não está onde deveria.

## Solução 1: abrir o Chat normal direto por uma URL (web)

A alternativa mais simples que encontrei para a versão web vem de uma [thread do Reddit sobre como voltar ao Chat em vez do Work](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/).

Consiste em abrir este endereço:

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

Um usuário explicou que essa rota permitia entrar direto na experiência normal de **Chat**, mesmo tendo usado o Work antes. Ele comentou ainda que, ao entrar assim, o seletor Chat/Work podia não aparecer, mas nesse caso porque a rota estava forçando a visualização de Chat.

Se funcionar para você, dá para salvar nos favoritos e usar para abrir o ChatGPT da forma habitual.

**Importante:** `/bot` é um acesso alternativo compartilhado pela comunidade, não uma opção oficial documentada para restaurar o modo padrão da conta. Pode deixar de funcionar ou se comportar de outro jeito em versões futuras. E **entrar por essa URL não significa necessariamente que você recuperou o seletor**.

## Solução 2: passar pelo Codex e voltar ao ChatGPT (app para computador)

Se o problema aparece no aplicativo do ChatGPT para computador, há outro método relatado por usuários que perderam o seletor **Chat/Work**:

1. Abra o menu do aplicativo e troque de **ChatGPT** para **Codex**.
2. Crie um **chat novo** no Codex.
3. Volte de **Codex** para **ChatGPT**.
4. Crie outro **chat novo**.
5. Verifique se o seletor **Chat / Work** reaparece e escolha **Chat**.

Essa sequência foi descrita por um usuário na [issue #49233 do repositório do Codex](https://github.com/openai/codex/issues/49233), que disse ter recuperado o seletor no Windows depois que outras tentativas não funcionaram.

Isso não significa que seja um reparo oficial nem que vá funcionar em todas as versões, mas faz mais sentido testar do que reinstalar tudo sem saber se vai ajudar.

## Solução 3: sair da conta e entrar de novo

Outro relato, a [issue #48700](https://github.com/openai/codex/issues/48700), conta que **sair explicitamente da conta** no aplicativo do Windows e entrar novamente restaurou o modo Chat e o seu seletor.

Também há usuários para quem sair, reiniciar ou reinstalar **não** resolveu nada. Por isso eu consideraria uma tentativa simples, mas não uma solução infalível.

Antes de apagar cookies ou dados locais, tente apenas sair da conta e autenticar de novo. Se você usa a web, pode verificar também se o problema ocorre em outra sessão do navegador, embora isso não garanta que a configuração da conta seja corrigida.

## E o script do Tampermonkey para deixar o Chat como padrão?

Na mesma thread do Reddit compartilharam um [userscript chamado «ChatGPT Default to Chat»](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184), pensado para gerenciadores como o Tampermonkey.

O funcionamento é bem direto: **ele procura o botão de Chat na página e, se estiver disponível e não selecionado, tenta clicar automaticamente**. É uma forma de automatizar uma ação na interface, não de mudar uma configuração interna da conta.

Aqui está o detalhe importante: **se o seletor ou o botão de Chat não existir naquela visualização, o script não tem no que clicar**. Portanto, pode ser útil para quem ainda vê o seletor mas volta ao Work ao iniciar, e não necessariamente para quem o perdeu por completo.

Além disso, é código de terceiros executado no seu navegador. Se decidir usá-lo, revise o código e as permissões antes de instalar. Eu não o colocaria como primeira solução quando basta testar uma URL.

## Isso significa que minha conta ficou presa no Work?

Não necessariamente. A interface abrir no Work ou o seletor ter desaparecido **não prova** que uma opção permanente foi alterada nos servidores da OpenAI. Pode ser um problema de interface, sessão, versão do aplicativo ou da liberação gradual do recurso. De fora não dá para saber a causa exata em cada conta.

Também não é preciso supor que os chats antigos foram danificados ou perdidos. A OpenAI explica que as conversas de Chat e Work podem aparecer juntas em **Recentes**. Para verificar se o funcionamento normal voltou, o mais claro é **criar um chat novo** e ver em que modo ele abre.

## Se nada funcionar: reportar à OpenAI

Se você continuar preso no Work, pode falar com o suporte em [**https://help.openai.com/**](https://help.openai.com/) usando o ícone de chat no canto inferior direito.

O melhor é explicar qual ação disparou o problema, em que dispositivo acontece e o que você já tentou. Por exemplo:

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

Não compartilhe senhas, códigos de acesso nem informações sensíveis no relato.

## Conclusão

Tudo isso começou porque apertei **«Try Work»** para ver o que havia de novo no Work, uma ferramenta que eu já conhecia e tinha usado. Eu esperava o de sempre: entrar, ver as novidades e voltar ao Chat quando quisesse.

O frustrante não foi o Work em si, e sim me ver sem um caminho evidente para voltar ao **Chat**, que era o que eu queria usar desde o começo.

Se aconteceu o mesmo com você, eu começaria por **`https://chatgpt.com/bot` se estiver na web**, ou por **trocar para o Codex e voltar ao ChatGPT se estiver no aplicativo para computador**. São caminhos diferentes para situações diferentes e nenhum deve ser confundido com um conserto definitivo da OpenAI.

Tomara que a opção de voltar ao Chat normal seja sempre visível e que não seja preciso procurar truques no Reddit para algo tão básico.

---

### Fontes e referências

- [Documentação oficial: ChatGPT Work e Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit: Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist: ChatGPT Default to Chat (userscript)](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub issue #49233: recuperação do seletor passando pelo Codex](https://github.com/openai/codex/issues/49233)
- [GitHub issue #48700: seletor ausente no Windows](https://github.com/openai/codex/issues/48700)
- [Central de ajuda: como entrar em contato com o suporte](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
