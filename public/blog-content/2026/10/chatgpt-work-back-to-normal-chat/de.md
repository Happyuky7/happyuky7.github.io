Vor Kurzem ist mir mit ChatGPT etwas ziemlich Absurdes passiert. Ich habe es wie immer geöffnet und bekam die Einladung, **Work** auszuprobieren, mit dem typischen Button **„Try Work“**. Zur Klarstellung: Ich weiß, was Work ist, und habe es schon benutzt. Geklickt habe ich eher mit dem Gedanken *„mal sehen, ob sie etwas Neues in Work eingebaut haben“*.

Mein Gedanke war ganz simpel: *„Alles klar, das bringt mich zu Work, ich schaue mir an, was neu ist, und gehe danach zum gewohnten ChatGPT zurück“*. So wie bei vielen anderen neuen Funktionen. Ich hätte nicht gedacht, dass dieser Klick etwas so Grundlegendes wie das Starten einer normalen Unterhaltung verkomplizieren könnte.

Doch als ich zurückwollte, erlebte ich eine Überraschung: **ChatGPT öffnete sich weiterhin in Work, und die Auswahl zum Wechseln zwischen Chat und Work war verschwunden**. Genau die Option, mit der ich die Änderung rückgängig machen wollte, schien sich in Luft aufgelöst zu haben.

Ich wollte Work gar nicht als meine übliche Art der ChatGPT-Nutzung aktivieren. Ich wollte nur sehen, was es Neues gibt. Also habe ich recherchiert, wie man die normale Oberfläche zurückbekommt, und diese Alternativen zusammengetragen, falls es jemand anderem genauso geht.

> **Hinweis:** Die hier genannten Lösungen aus der Community sind *Workarounds*, keine garantierten offiziellen Korrekturen. Die Oberfläche von ChatGPT ändert sich häufig, und manche Ansätze funktionieren nur im Web oder nur in der Desktop-App.

## Was ist ChatGPT Work und warum sieht es anders aus?

ChatGPT hat zwei unterschiedliche Erfahrungen: **Chat**, zum Unterhalten, Fragen stellen und für die gewohnte Nutzung des Assistenten, und **Work**, ausgerichtet auf längere Aufgaben mit mehreren Schritten. **Codex** ist noch eine weitere Erfahrung, mit Fokus auf Programmierung.

Es ist nicht so, dass Work schlecht wäre. Ich möchte es nur nicht für alles verwenden. Wenn ich kurz eine Frage stellen will, sollte ich einen normalen Chat starten können, ohne mich mit der Oberfläche herumzuschlagen.

Laut der [OpenAI-Dokumentation zu ChatGPT Work und Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex) sollte man in der Desktop-App **ChatGPT** auswählen und anschließend **Chat** oder **Work** wählen können. Das Problem beginnt, wenn diese Auswahl nicht dort ist, wo sie sein sollte.

## Lösung 1: den normalen Chat direkt über eine URL öffnen (Web)

Die einfachste Alternative, die ich für die Webversion gefunden habe, stammt aus einem [Reddit-Thread darüber, wie man statt Work wieder zu Chat zurückkommt](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/).

Sie besteht darin, diese Adresse zu öffnen:

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

Ein Nutzer berichtete, dass ihn dieser Pfad direkt in die normale **Chat**-Erfahrung brachte, auch wenn er zuvor Work verwendet hatte. Er erwähnte außerdem, dass der Chat/Work-Umschalter bei diesem Einstieg möglicherweise nicht erscheint – in dem Fall aber, weil der Pfad selbst die Chat-Ansicht erzwingt.

Wenn es bei dir funktioniert, kannst du die Adresse als Lesezeichen speichern und ChatGPT damit wie gewohnt öffnen.

**Wichtig:** `/bot` ist ein alternativer Zugang aus der Community, keine offiziell dokumentierte Option, um den Standardmodus des Kontos zurückzusetzen. Er kann in künftigen Versionen aufhören zu funktionieren oder sich anders verhalten. Und **über diese URL einzusteigen bedeutet nicht zwangsläufig, dass du den Umschalter zurückhast**.

## Lösung 2: über Codex gehen und zu ChatGPT zurückkehren (Desktop-App)

Wenn das Problem in der ChatGPT-Desktop-App auftritt, gibt es eine weitere Methode, die Nutzer berichtet haben, die den Umschalter **Chat/Work** verloren hatten:

1. Öffne das Menü der App und wechsle von **ChatGPT** zu **Codex**.
2. Erstelle einen **neuen Chat** in Codex.
3. Wechsle wieder von **Codex** zu **ChatGPT**.
4. Erstelle noch einen **neuen Chat**.
5. Prüfe, ob der Umschalter **Chat / Work** wieder erscheint, und wähle **Chat**.

Diese Abfolge beschrieb ein Nutzer im [Issue #49233 des Codex-Repositorys](https://github.com/openai/codex/issues/49233); er gab an, den Umschalter unter Windows zurückbekommen zu haben, nachdem andere Versuche fehlgeschlagen waren.

Das macht es weder zu einer offiziellen Reparatur noch zu einer Garantie für alle Versionen, aber es ist sinnvoller, das zu versuchen, als alles neu zu installieren, ohne zu wissen, ob es hilft.

## Lösung 3: abmelden und wieder anmelden

Ein anderer Bericht, [Issue #48700](https://github.com/openai/codex/issues/48700), schildert, dass **ausdrückliches Abmelden** in der Windows-App und erneutes Anmelden den Chat-Modus und dessen Umschalter wiederhergestellt hat.

Es gibt aber auch Nutzer, bei denen Abmelden, Neustarten oder Neuinstallieren **nichts** gelöst hat. Deshalb würde ich es als einfachen Versuch betrachten, nicht als sichere Lösung.

Bevor du Cookies oder lokale Daten löschst, probiere einfach, dich abzumelden und neu zu authentifizieren. Im Web kannst du außerdem prüfen, ob das Problem in einer anderen Browser-Sitzung auftritt – auch wenn das nicht sicherstellt, dass die Einstellung deines Kontos korrigiert wird.

## Und das Tampermonkey-Skript, das Chat als Standard setzt?

Im selben Reddit-Thread wurde ein [Userscript namens „ChatGPT Default to Chat“](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184) geteilt, gedacht für Manager wie Tampermonkey.

Die Funktionsweise ist recht direkt: **Es sucht den Chat-Button auf der Seite und versucht, ihn automatisch zu klicken, wenn er vorhanden und nicht ausgewählt ist**. Das automatisiert eine Aktion in der Oberfläche; es ändert keine interne Kontoeinstellung.

Und hier das Entscheidende: **Wenn der Umschalter oder der Chat-Button in dieser Ansicht nicht existiert, hat das Skript nichts zum Klicken**. Es kann also denen helfen, die den Umschalter noch sehen, aber beim Start wieder in Work landen – nicht zwangsläufig denen, die ihn vollständig verloren haben.

Außerdem ist es Code von Dritten, der in deinem Browser läuft. Wenn du ihn verwendest, sieh dir vor der Installation den Code und seine Berechtigungen an. Ich würde ihn nicht als erste Lösung nehmen, solange es reicht, eine URL auszuprobieren.

## Heißt das, mein Konto ist in Work gesperrt?

Nicht unbedingt. Dass sich die Oberfläche in Work öffnet oder der Umschalter verschwunden ist, **beweist nicht**, dass auf den Servern von OpenAI eine dauerhafte Option geändert wurde. Es kann an der Oberfläche, der Sitzung, der App-Version oder am Rollout der Funktion liegen. Von außen lässt sich die genaue Ursache für ein einzelnes Konto nicht feststellen.

Man muss auch nicht annehmen, dass alte Chats beschädigt oder verloren sind. OpenAI erklärt, dass Chat- und Work-Unterhaltungen gemeinsam unter **Zuletzt verwendet** erscheinen können. Um zu prüfen, ob das normale Verhalten zurück ist, erstellst du am besten **einen neuen Chat** und siehst nach, in welchem Modus er sich öffnet.

## Wenn nichts hilft: OpenAI informieren

Wenn du weiterhin in Work feststeckst, kannst du den Support über [**https://help.openai.com/**](https://help.openai.com/) erreichen, über das Chat-Symbol unten rechts.

Am besten erklärst du, welche Aktion das Problem ausgelöst hat, auf welchem Gerät es auftritt und was du bereits versucht hast. Zum Beispiel:

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

Teile im Bericht keine Passwörter, Zugangscodes oder sensiblen Informationen.

## Fazit

Das alles begann, weil ich **„Try Work“** gedrückt habe, um zu sehen, was es in Work Neues gibt – ein Tool, das ich schon kannte und benutzt hatte. Ich habe das Übliche erwartet: hinein, die Neuerungen ansehen und zurück zu Chat, wann immer ich will.

Frustrierend war nicht Work selbst, sondern mich ohne einen offensichtlichen Weg zurück zu **Chat** wiederzufinden – also zu dem, was ich von Anfang an nutzen wollte.

Wenn es dir genauso ging, würde ich mit **`https://chatgpt.com/bot` im Web** anfangen oder damit, **in der Desktop-App zu Codex und zurück zu ChatGPT zu wechseln**. Das sind verschiedene Wege für verschiedene Situationen, und keiner davon sollte mit einer endgültigen Lösung von OpenAI verwechselt werden.

Hoffentlich bleibt die Möglichkeit, zum normalen Chat zurückzukehren, immer sichtbar, und man muss für so etwas Grundlegendes keine Tricks auf Reddit suchen.

---

### Quellen und Referenzen

- [Offizielle Dokumentation: ChatGPT Work und Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit: Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist: ChatGPT Default to Chat (Userscript)](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub Issue #49233: Umschalter über Codex zurückholen](https://github.com/openai/codex/issues/49233)
- [GitHub Issue #48700: fehlender Umschalter unter Windows](https://github.com/openai/codex/issues/48700)
- [Hilfecenter: Kontakt zum Support](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
