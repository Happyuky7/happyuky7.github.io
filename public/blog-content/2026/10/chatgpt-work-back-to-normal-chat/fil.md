Kamakailan, may nangyari sa akin sa ChatGPT na medyo katawa-tawa. Pumasok ako gaya ng dati at lumabas ang imbitasyong subukan ang **Work** kasama ang pamilyar na button na **«Try Work»**. Para malinaw: alam ko kung ano ang Work at nagamit ko na ito. Pinindot ko iyon dahil naisip ko, *«tingnan nga natin kung may bago silang inilagay sa Work»*.

Simple lang ang iniisip ko: *«Ah, sige, dadalhin ako nito sa Work, titingnan ko kung ano ang bago, tapos babalik ako sa dating ChatGPT»*. Gaya ng nangyayari sa napakaraming bagong feature. Hindi ko inakalang ang isang pindot na iyon ay magpapahirap sa isang bagay na kasimpleng pagsisimula ng normal na usapan.

Pero nang gusto ko nang bumalik, may sorpresang naghihintay: **patuloy na bumubukas ang ChatGPT sa Work at wala na ang selector para maglipat sa pagitan ng Chat at Work**. Ibig sabihin, ang mismong opsyong aasahan kong gamitin para ibalik ang dati ay parang naglaho.

Hindi ko hinahangad na gawing default kong paraan ng paggamit ng ChatGPT ang Work. Gusto ko lang makita kung ano ang mga bago. Kaya naghanap ako kung paano maibabalik ang normal na interface, at tinipon ko ang mga alternatibong ito sakaling mangyari rin ito sa iba.

> **Paalala:** ang mga solusyon mula sa komunidad dito ay mga *workaround*, hindi garantisadong opisyal na pag-aayos. Madalas magbago ang interface ng ChatGPT at may ilang paraang gumagana lang sa web o sa desktop app.

## Ano ang ChatGPT Work at bakit iba ang itsura nito?

May dalawang magkaibang karanasan ang ChatGPT: ang **Chat**, para sa pakikipag-usap, pagtatanong at karaniwang paggamit ng assistant, at ang **Work**, nakatuon sa mas mahahabang gawaing may ilang hakbang. Ang **Codex** naman ay ibang karanasan pa, nakasentro sa programming.

Hindi naman masama ang Work. Ayoko lang gamitin iyon sa lahat ng bagay. Kung pumasok ako para magtanong nang mabilisan, dapat ay makapagsimula ako ng normal na chat nang hindi nakikipagbuno sa interface.

Ayon sa [dokumentasyon ng OpenAI tungkol sa ChatGPT Work at Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex), sa desktop app ay dapat posibleng piliin ang **ChatGPT** at saka pumili ng **Chat** o **Work**. Nagsisimula ang problema kapag wala ang selector na iyon sa dapat nitong kinalalagyan.

## Solusyon 1: buksan ang normal na Chat mula mismo sa isang URL (web)

Ang pinakasimpleng alternatibong nahanap ko para sa web ay galing sa isang [thread sa Reddit tungkol sa pagbalik sa Chat sa halip na Work](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/).

Buksan lang ang address na ito:

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

Ipinaliwanag ng isang user na dinadala siya nito nang diretso sa normal na karanasan ng **Chat**, kahit na Work ang ginagamit niya bago nito. Binanggit din niyang kapag ganito ang pagpasok, maaaring hindi lumabas ang Chat/Work selector — pero sa kasong iyon dahil pinipilit mismo ng route ang Chat view.

Kung gumana sa iyo, puwede mong i-bookmark at gamitin para buksan ang ChatGPT gaya ng dati.

**Mahalaga:** ang `/bot` ay alternatibong daanang ibinahagi ng komunidad, hindi isang opisyal na dokumentadong opsyon para i-reset ang default mode ng account. Puwedeng tumigil ito sa paggana o mag-iba ang kilos sa susunod na mga bersyon. At **ang pagpasok sa URL na iyon ay hindi awtomatikong nangangahulugang nabawi mo na ang selector**.

## Solusyon 2: dumaan sa Codex at bumalik sa ChatGPT (desktop app)

Kung sa desktop app ng ChatGPT lumalabas ang problema, may isa pang paraang iniulat ng mga user na nawalan ng **Chat/Work** selector:

1. Buksan ang menu ng app at lumipat mula **ChatGPT** patungong **Codex**.
2. Gumawa ng **bagong chat** sa Codex.
3. Bumalik mula **Codex** patungong **ChatGPT**.
4. Gumawa ng isa pang **bagong chat**.
5. Tingnan kung bumalik ang **Chat / Work** selector at piliin ang **Chat**.

Inilarawan ang pagkakasunod-sunod na ito ng isang user sa [issue #49233 ng repository ng Codex](https://github.com/openai/codex/issues/49233), na sinabing nabawi niya ang selector sa Windows matapos mabigo ang ibang pagsubok.

Hindi ito nangangahulugang opisyal na pag-aayos o gagana sa lahat ng bersyon, pero mas makatuwirang subukan ito kaysa mag-reinstall ng lahat nang hindi alam kung makakatulong.

## Solusyon 3: mag-log out at mag-log in ulit

May isa pang ulat, ang [issue #48700](https://github.com/openai/codex/issues/48700), na nagsasabing ang **tahasang pag-log out** sa Windows app at muling pag-log in ay nagpabalik sa Chat mode at sa selector nito.

May mga user din na hindi naresolba ng pag-log out, pag-restart o pag-reinstall ang **anuman**. Kaya ituturing ko itong simpleng pagsubok, hindi tiyak na solusyon.

Bago magbura ng cookies o lokal na data, subukan lang munang mag-log out at mag-authenticate muli. Kung nasa web ka, puwede mo ring tingnan kung nangyayari ang problema sa ibang session ng browser, kahit hindi nito tinitiyak na maaayos ang setting ng account mo.

## Paano naman ang script sa Tampermonkey para gawing default ang Chat?

Sa parehong thread sa Reddit, ibinahagi ang isang [userscript na tinatawag na «ChatGPT Default to Chat»](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184), ginawa para sa mga manager gaya ng Tampermonkey.

Tuwiran ang paggana nito: **hinahanap nito ang Chat button sa page at, kung naroon ito at hindi napili, sinusubukan nitong pindutin nang awtomatiko**. Paraan ito ng pag-automate ng aksyon sa interface, hindi ng pagbabago sa panloob na setting ng account.

At narito ang mahalagang detalye: **kung wala ang selector o ang Chat button sa view na iyon, walang maipipindot ang script**. Kaya puwede itong makatulong sa mga nakakakita pa ng selector pero palaging napupunta sa Work pagbukas, hindi naman sa mga tuluyang nawalan nito.

Bukod pa roon, third-party code ito na tumatakbo sa browser mo. Kung gagamitin mo, suriin ang code at ang mga pahintulot nito bago i-install. Hindi ko ito ilalagay bilang unang solusyon kung sapat nang subukan ang isang URL.

## Ibig bang sabihin ay naka-lock na ang account ko sa Work?

Hindi naman kinakailangan. Ang pagbukas ng interface sa Work o ang pagkawala ng selector ay **hindi patunay** na may permanenteng opsyong binago sa mga server ng OpenAI. Maaaring isyu ito sa interface, session, bersyon ng app, o sa paglabas ng feature. Mula sa labas, walang paraan para malaman ang eksaktong dahilan sa bawat account.

Hindi rin dapat ipagpalagay na nasira o nawala ang mga lumang chat. Ipinapaliwanag ng OpenAI na maaaring magkasamang lumabas ang mga usapan ng Chat at Work sa **Recents**. Para matiyak kung bumalik na ang normal na paggana, pinakamalinaw na **gumawa ng bagong chat** at tingnan kung anong mode ito bubukas.

## Kung wala talagang gumana: iulat ito sa OpenAI

Kung nananatili kang naipit sa Work, puwede kang makipag-ugnayan sa suporta sa [**https://help.openai.com/**](https://help.openai.com/) gamit ang chat icon sa kanang ibabang sulok.

Mainam na ipaliwanag kung anong aksyon ang nagdulot ng problema, sa anong device ito nangyayari, at ano ang nasubukan mo na. Halimbawa:

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

Huwag maglagay ng password, access code o sensitibong impormasyon sa ulat.

## Konklusyon

Nagsimula ang lahat ng ito dahil pinindot ko ang **«Try Work»** para makita kung ano ang bago sa Work, isang tool na kilala ko na at nagamit ko na. Ang inaasahan ko ay ang dati: pumasok, tingnan ang mga bago, at bumalik sa Chat kung kailan ko gusto.

Ang nakakainis ay hindi ang Work mismo, kundi ang mapag-isa nang walang malinaw na daan pabalik sa **Chat**, na siya namang gusto kong gamitin mula pa sa simula.

Kung nangyari rin ito sa iyo, magsisimula ako sa **`https://chatgpt.com/bot` kung nasa web ka**, o sa **paglipat sa Codex at pagbalik sa ChatGPT kung nasa desktop app ka**. Magkaibang daan ang mga ito para sa magkaibang sitwasyon, at hindi dapat ipagkamali ang alinman sa isang tiyakang pag-aayos mula sa OpenAI.

Sana laging nakikita ang opsyong bumalik sa normal na Chat, at hindi na kailangang maghanap ng mga diskarte sa Reddit para sa isang bagay na ganito kabatayan.

---

### Mga pinagkunan at sanggunian

- [Opisyal na dokumentasyon: ChatGPT Work at Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit: Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist: ChatGPT Default to Chat (userscript)](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub issue #49233: pagbawi ng selector sa pamamagitan ng Codex](https://github.com/openai/codex/issues/49233)
- [GitHub issue #48700: nawawalang selector sa Windows](https://github.com/openai/codex/issues/48700)
- [Help Center: paano makipag-ugnayan sa suporta](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
