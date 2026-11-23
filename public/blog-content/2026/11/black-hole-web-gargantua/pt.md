Isso começou por tédio e saiu um pouco do controle. Eu queria ver **Gargantua**, o buraco negro de *Interstellar*, se movendo no navegador. E não uma imagem com um anel pintado por cima, mas algo calculado de verdade com a física de um buraco negro que gira.

O resultado é o **Black Hole Web**. Você pode testar em [gargantua.happyuky7.com](https://gargantua.happyuky7.com), e o código está no [GitHub](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) (MIT).

> **Aviso:** o site calcula cada pixel em tempo real, então pode deixar seu dispositivo lento ou quente. O recomendado é ver em um PC ou notebook com placa de vídeo. No celular pode travar; se acontecer, mude a qualidade para *Fast*.

Este post não é um tutorial de programação. É mais o que fui aprendendo no caminho, explicado do jeito mais simples possível: o que é um buraco negro, por que Gargantua tem essa aparência e como o site faz para desenhá-lo.

![Gargantua no modo Cinema, com a câmera do filme](/blog-content/2026/11/black-hole-web-gargantua/cinema.webp)

## O que é um buraco negro?

É uma região com tanta massa concentrada que o espaço-tempo se curva a ponto de nada conseguir sair, nem mesmo a luz. A borda dessa região se chama **horizonte de eventos**: o que passa por ela não volta.

Existem dois modelos clássicos:

- **Schwarzschild** (1916): um buraco negro que não gira. É o caso mais simples.
- **Kerr** (1963): um buraco negro que **gira**. É o que importa na vida real, porque quase tudo no universo gira, e também é o caso de Gargantua.

Girar muda muita coisa. O buraco negro arrasta o espaço-tempo ao seu redor, e a luz que passa por um lado não segue o mesmo caminho da que passa pelo outro. Por isso a sombra de Gargantua não é um círculo perfeito: ela é um pouco achatada de um lado.

## Por que Gargantua tem essa aparência?

Ao redor do buraco negro existe um **disco de acreção**: gás girando tão rápido e ficando tão quente que brilha. Esse disco é plano, como os anéis de Saturno. Então por que no filme parece haver um arco em cima e outro embaixo?

É a **lente gravitacional**. A luz que sai da parte do disco que está *atrás* do buraco negro não viaja em linha reta: a gravidade a curva por cima e por baixo, e ela chega até nós. O que parece um "halo" acima da sombra é, na verdade, a parte de trás do disco.

Olhando com atenção, também há um **anel de fótons** bem fino colado à sombra. É luz que deu meia volta ou mais ao redor do buraco negro antes de escapar.

Nada disso está pintado no site. Tudo sai das equações.

## O que o filme mudou de propósito

Os efeitos de *Interstellar* foram feitos com a consultoria do físico **Kip Thorne**, e a equipe depois publicou um artigo científico sobre como os calcularam ([James et al., 2015](https://arxiv.org/abs/1502.03808)). Mas fizeram uma concessão importante.

Em um buraco negro real, o lado do disco que vem **em nossa direção** parece muito mais brilhante e mais azul, e o que se afasta, mais fraco e mais vermelho. É o **efeito Doppler** relativístico. No filme, isso foi removido, porque um disco assimétrico e com cores estranhas teria confundido o público.

Por isso o site tem duas formas de ver:

- **Modos artísticos**, que recriam o estilo do filme: disco dourado, sem assimetria Doppler, granulação de filme e formato 2.39:1.
- **Modo científico**, que desliga tudo isso e mostra o que uma câmera de verdade gravaria.

## Os cinco modos

O site vem com cinco presets. Todos usam os mesmos caminhos de luz; o que muda é o giro, a câmera e o quanto se parece com o filme.

**Interstellar.** O visual do filme: giro 0,6, disco dourado sem Doppler, granulação de filme e formato 2.39:1.

![Modo Interstellar](/blog-content/2026/11/black-hole-web-gargantua/interstellar.webp)

**Cinema.** A câmera exata do filme, bem longe do buraco negro, com céu preto e estrelas distantes. É a imagem do começo do post.

**Scientific.** Toda a física: disco de corpo negro, Doppler exato e desvio gravitacional para o vermelho. O lado que se aproxima brilha muito mais.

![Modo Scientific](/blog-content/2026/11/black-hole-web-gargantua/scientific.webp)

**Clean Kerr.** Giro de 0,94 com o Doppler real, mas com o disco no estilo do filme. Por isso um lado brilha mais que o outro.

![Modo Clean Kerr](/blog-content/2026/11/black-hole-web-gargantua/clean-kerr.webp)

**Edge-on.** Giro quase máximo (0,998) e a câmera quase no plano do disco: uma faixa fina muito brilhante e uma lente gravitacional muito forte.

![Modo Edge-on](/blog-content/2026/11/black-hole-web-gargantua/edge-on.webp)

## Como o site desenha

A ideia se chama **ray tracing reverso**. Para cada pixel da tela, o site lança um raio de luz a partir da câmera *para trás* e o acompanha pelo espaço-tempo curvado. Três coisas podem acontecer:

1. **Bate no disco**: o pixel recebe a cor do gás naquele ponto.
2. **Cai no horizonte**: o pixel fica preto. É assim que a sombra aparece.
3. **Escapa**: o pixel mostra a estrela para onde o raio aponta no final. É assim que o fundo de estrelas se deforma.

Tudo isso é calculado na GPU, para cada pixel, em cada quadro. O caminho da luz é integrado passo a passo. Há dois métodos: *leapfrog*, mais rápido, para os modos artísticos, e **RK4**, que com o mesmo número de passos é cerca de **7 vezes mais preciso**, para o modo científico.

## A temperatura do disco

No modo científico, a cor do disco não é escolhida à mão. Ela vem de um modelo físico (Novikov–Thorne) que calcula o quão quente o gás está a partir da **massa** do buraco negro e de **quanto material ele está engolindo**. Depois esse calor vira cor com as curvas que a ciência usa para descrever como enxergamos as cores.

Tem um detalhe que achei muito curioso:

$$
T \propto \left(\frac{\lambda_{\text{Edd}}}{M}\right)^{1/4}
$$

A temperatura cai quando a massa sobe. Ou seja: **quanto maior o buraco negro, mais frio é o seu disco**. Um buraco negro de cem milhões de sóis, engolindo a 10 % do seu limite, brilha branco-azulado, a uns 120 000 K. Se você diminuir quanto ele engole, o disco fica dourado e o lado Doppler fica muito mais dramático.

## O que ainda não simula

O modo científico tenta ser honesto, então também diz o que não faz:

- Supõe um disco **fino**. Buracos negros como o M87\*, o da [primeira foto real](https://eventhorizontelescope.org/) de 2019, engolem tão pouco que o gás forma uma nuvem grossa e quente que isto não simula.
- Não tem **jato** nem coroa.
- Não recalcula a luz que o disco devolve para si mesmo.
- A câmera fica parada. Uma nave em órbita, como a Endurance, veria o céu um pouco deslocado.

## Se quiser aprender mais

Dentro do site há uma página chamada **A física** (`/physics`) que explica cada equação passo a passo, da métrica de Kerr até a cor de um pixel. Ela é baseada em **27 fontes científicas** com DOIs verificados. Também há uma versão técnica no repositório: [PHYSICS.md](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style/blob/master/docs/PHYSICS.md).

Se usar em uma aula ou palestra, o repositório tem o botão de citação do GitHub, e a página de física traz a citação pronta em APA e BibTeX.

## Experimente

Abra [gargantua.happyuky7.com](https://gargantua.happyuky7.com), arraste o mouse para orbitar e aperte **V** para voar livremente até quase encostar na esfera de fótons. Teste os cinco presets: *Interstellar*, *Cinema*, *Scientific*, *Clean Kerr* e *Edge-on*. Se travar, mude a qualidade para *Fast*.

Começou como algo para passar o tempo e acabou sendo uma das coisas com que mais aprendi este ano. Se você ficar olhando para um buraco negro por mais tempo do que planejava, uma ⭐ no [repositório](https://github.com/Happyuky7/Black-Hole-Web-Interstellar-Style) é bem-vinda.
