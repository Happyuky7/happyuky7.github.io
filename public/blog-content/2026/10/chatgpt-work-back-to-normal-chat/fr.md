Il m'est arrivé récemment quelque chose d'assez absurde avec ChatGPT. Je l'ai ouvert comme d'habitude et une invitation à essayer **Work** est apparue avec le fameux bouton **« Try Work »**. Précision : je sais ce qu'est Work et je l'ai déjà utilisé. J'ai cliqué surtout en me disant *« voyons s'ils ont ajouté quelque chose de nouveau dans Work »*.

Mon raisonnement était très simple : *« D'accord, ça va m'emmener sur Work, je regarde ce qu'il y a de nouveau et je reviens ensuite au ChatGPT habituel »*. Comme pour tant d'autres nouveautés. Je n'imaginais pas que ce clic puisse compliquer quelque chose d'aussi basique que démarrer une conversation normale.

Mais au moment de revenir en arrière, surprise : **ChatGPT continuait de s'ouvrir sur Work et le sélecteur permettant de basculer entre Chat et Work n'apparaissait plus**. Autrement dit, l'option que je comptais utiliser pour annuler le changement semblait s'être volatilisée.

Je ne cherchais pas à activer Work comme mode d'utilisation habituel. J'avais simplement envie de voir les nouveautés. Je me suis donc mis à chercher comment retrouver l'interface normale, et j'ai rassemblé ces pistes au cas où cela arriverait à quelqu'un d'autre.

> **Remarque :** les solutions de la communauté présentées ici sont des *contournements*, pas des correctifs officiels garantis. L'interface de ChatGPT change souvent et certaines ne fonctionnent que sur le web ou que dans l'application de bureau.

## Qu'est-ce que ChatGPT Work et pourquoi l'affichage change-t-il ?

ChatGPT propose deux expériences distinctes : **Chat**, pour discuter, poser des questions et utiliser l'assistant de la manière habituelle, et **Work**, pensée pour des tâches plus longues en plusieurs étapes. **Codex** est encore une autre expérience, centrée sur la programmation.

Ce n'est pas que Work soit mauvais. Simplement, je ne veux pas l'utiliser pour tout. Si j'entre pour poser une question rapide, il est logique de pouvoir démarrer un chat normal sans me battre avec l'interface.

D'après la [documentation d'OpenAI sur ChatGPT Work et Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex), l'application de bureau devrait permettre de sélectionner **ChatGPT** puis de choisir **Chat** ou **Work**. Le problème commence quand ce sélecteur n'est pas là où il devrait être.

## Solution 1 : ouvrir le Chat normal directement depuis une URL (web)

La piste la plus simple que j'ai trouvée pour la version web vient d'un [fil Reddit sur la manière de revenir à Chat plutôt qu'à Work](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/).

Il s'agit d'ouvrir cette adresse :

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

Un utilisateur a expliqué que cette route lui permettait d'entrer directement dans l'expérience **Chat** normale, même après avoir utilisé Work. Il précisait aussi qu'en entrant ainsi, le sélecteur Chat/Work pouvait ne pas s'afficher, mais dans ce cas parce que la route forçait elle-même la vue Chat.

Si cela fonctionne pour vous, vous pouvez l'ajouter aux favoris et l'utiliser pour ouvrir ChatGPT comme avant.

**Important :** `/bot` est un accès alternatif partagé par la communauté, pas une option officielle documentée pour réinitialiser le mode par défaut du compte. Il peut cesser de fonctionner ou se comporter autrement dans de futures versions. Et **passer par cette URL ne signifie pas nécessairement que vous avez récupéré le sélecteur**.

## Solution 2 : passer par Codex puis revenir à ChatGPT (application de bureau)

Si le problème apparaît dans l'application de bureau de ChatGPT, une autre méthode a été rapportée par des utilisateurs ayant perdu le sélecteur **Chat/Work** :

1. Ouvrez le menu de l'application et passez de **ChatGPT** à **Codex**.
2. Créez un **nouveau chat** dans Codex.
3. Repassez de **Codex** à **ChatGPT**.
4. Créez un autre **nouveau chat**.
5. Vérifiez si le sélecteur **Chat / Work** réapparaît et choisissez **Chat**.

Cette séquence a été décrite par un utilisateur dans l'[issue #49233 du dépôt de Codex](https://github.com/openai/codex/issues/49233), qui indiquait avoir récupéré le sélecteur sous Windows après l'échec d'autres tentatives.

Cela n'en fait pas une réparation officielle, ni une garantie pour toutes les versions, mais c'est plus sensé à essayer que de tout réinstaller sans savoir si cela aidera.

## Solution 3 : se déconnecter et se reconnecter

Un autre signalement, l'[issue #48700](https://github.com/openai/codex/issues/48700), raconte que se **déconnecter explicitement** de l'application Windows puis se reconnecter a restauré le mode Chat et son sélecteur.

D'autres utilisateurs, en revanche, n'ont **rien** résolu en se déconnectant, en redémarrant ou en réinstallant. Je le considère donc comme une tentative simple, pas comme une solution infaillible.

Avant d'effacer des cookies ou des données locales, essayez simplement de vous déconnecter et de vous authentifier à nouveau. Sur le web, vous pouvez aussi vérifier si le problème se produit dans une autre session de navigateur, même si cela ne garantit pas que le réglage du compte sera corrigé.

## Et le script Tampermonkey pour mettre Chat par défaut ?

Dans le même fil Reddit, un [userscript appelé « ChatGPT Default to Chat »](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184) a été partagé, conçu pour des gestionnaires comme Tampermonkey.

Son fonctionnement est assez direct : **il cherche le bouton Chat sur la page et, s'il est disponible et non sélectionné, tente de le cliquer automatiquement**. C'est une façon d'automatiser une action dans l'interface, pas de modifier un réglage interne du compte.

Et voici le détail important : **si le sélecteur ou le bouton Chat n'existe pas dans cette vue, le script n'a rien à cliquer**. Il peut donc être utile à ceux qui voient encore le sélecteur mais retombent sur Work au démarrage, pas nécessairement à ceux qui l'ont complètement perdu.

De plus, c'est du code tiers exécuté dans votre navigateur. Si vous décidez de l'utiliser, relisez le code et ses permissions avant de l'installer. Je n'en ferais pas ma première solution quand il suffit d'essayer une URL.

## Est-ce que cela veut dire que mon compte est bloqué sur Work ?

Pas nécessairement. Le fait que l'interface s'ouvre sur Work ou que le sélecteur ait disparu **ne prouve pas** qu'une option permanente a été modifiée sur les serveurs d'OpenAI. Cela peut relever de l'interface, de la session, de la version de l'application ou du déploiement de la fonctionnalité. De l'extérieur, impossible de connaître la cause exacte pour chaque compte.

Il ne faut pas non plus supposer que les anciens chats ont été endommagés ou perdus. OpenAI explique que les conversations Chat et Work peuvent apparaître ensemble dans **Récents**. Pour vérifier si le fonctionnement normal est revenu, le plus clair est de **créer un nouveau chat** et de voir dans quel mode il s'ouvre.

## Si rien ne fonctionne : le signaler à OpenAI

Si vous restez bloqué sur Work, vous pouvez contacter le support depuis [**https://help.openai.com/**](https://help.openai.com/) via l'icône de chat en bas à droite.

Le mieux est d'expliquer quelle action a déclenché le problème, sur quel appareil il se produit et ce que vous avez déjà essayé. Par exemple :

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

Ne communiquez pas de mots de passe, de codes d'accès ni d'informations sensibles dans le signalement.

## Conclusion

Tout cela a commencé parce que j'ai appuyé sur **« Try Work »** pour voir ce qu'il y avait de nouveau dans Work, un outil que je connaissais et que j'avais déjà utilisé. Je m'attendais à l'habituel : entrer, voir les nouveautés et revenir à Chat quand je le voulais.

Le plus frustrant n'a pas été Work en lui-même, mais de me retrouver sans chemin évident pour revenir à **Chat**, qui est ce que je voulais utiliser depuis le début.

Si cela vous est arrivé, je commencerais par **`https://chatgpt.com/bot` si vous êtes sur le web**, ou par **passer sur Codex puis revenir à ChatGPT si vous êtes dans l'application de bureau**. Ce sont des chemins différents pour des situations différentes, et aucun ne doit être confondu avec un correctif définitif d'OpenAI.

J'espère que l'option de revenir au Chat normal sera toujours visible et qu'il ne faudra pas chercher des astuces sur Reddit pour quelque chose d'aussi basique.

---

### Sources et références

- [Documentation officielle : ChatGPT Work et Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit : Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist : ChatGPT Default to Chat (userscript)](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub issue #49233 : récupération du sélecteur en passant par Codex](https://github.com/openai/codex/issues/49233)
- [GitHub issue #48700 : sélecteur absent sous Windows](https://github.com/openai/codex/issues/48700)
- [Centre d'aide : comment contacter le support](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
